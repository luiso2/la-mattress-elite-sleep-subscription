import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/services/shopify.service';
import { couponService } from '@/lib/services/coupon.service';
import emailService from '@/lib/services/email.service';

// Webhook público para crear cupones en Shopify
// Este endpoint NO requiere autenticación JWT
// Diseñado para recibir solicitudes externas (como de Google Apps Script o sistemas externos)

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  const allowedOrigins = [
    'https://mattressstoreslosangeles.com',
    'https://www.mattressstoreslosangeles.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://lamattressubscription.merktop.com'
  ];
  
  // Since this is a webhook, we'll allow the specific origins
  response.headers.set('Access-Control-Allow-Origin', 'https://mattressstoreslosangeles.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // Incluimos TODOS los headers que el navegador pueda enviar
  response.headers.set('Access-Control-Allow-Headers', '*');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extraer datos del request
    const {
      code,
      discount_type = 'percentage', // percentage o fixed_amount
      discount_value,
      description,
      valid_from,
      valid_until,
      max_uses,
      minimum_purchase,
      applies_to = 'all', // all, specific_products, specific_collections
      customer_name,
      customer_email,
      customer_phone
    } = body;

    // Validación básica
    if (!code || !discount_value) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Código y valor de descuento son requeridos'
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    console.log('🎫 Creating new coupon via webhook:', { 
      code, 
      discount_type, 
      discount_value,
      customer_email 
    });

    // Verificar si el cupón ya existe en Shopify
    const existingCoupon = await shopifyService.validateCouponCode(code.toUpperCase());
    
    if (existingCoupon.valid) {
      console.log('⚠️ Coupon already exists in Shopify:', code);
      
      // Si el cupón ya existe, aún podemos enviar el email si hay uno
      if (customer_email) {
        console.log('📧 Sending email for existing coupon...');
        
        const emailSent = await emailService.sendTradeInCouponEmail(
          customer_email,
          {
            customerName: customer_name || 'Valued Customer',
            couponCode: code.toUpperCase(),
            discountValue: Number(discount_value),
            discountType: discount_type as 'percentage' | 'fixed_amount',
            expiryDate: valid_until ? new Date(valid_until) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            minimumPurchase: minimum_purchase ? Number(minimum_purchase) : undefined
          }
        );
        
        if (emailSent) {
          console.log('✅ Email sent for existing coupon');
        }
      }
      
      const responseData = {
        success: true,
        message: 'Cupón ya existe en Shopify, email enviado si correspondía',
        data: {
          existing_coupon: true,
          code: code.toUpperCase(),
          email_sent: customer_email ? true : false
        }
      };
      
      const successResponse = NextResponse.json(responseData);
      return addCorsHeaders(successResponse);
    }

    // Crear el cupón usando el servicio completo (incluye Shopify + BD)
    let result = null;
    let shopifyResult = null;
    
    if (customer_email || customer_name) {
      // Si hay información del cliente, usar el servicio completo
      console.log('💾 Creating coupon with customer info...');
      
      result = await couponService.createCoupon({
        customerEmail: customer_email || '',
        customerName: customer_name || 'Guest',
        customerPhone: customer_phone,
        code: code.toUpperCase(),
        discountType: discount_type as 'percentage' | 'fixed_amount',
        discountValue: Number(discount_value),
        description: description || `Cupón ${code}`,
        validFrom: valid_from ? new Date(valid_from) : new Date(),
        validUntil: valid_until ? new Date(valid_until) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días por defecto
        maxUses: max_uses ? Number(max_uses) : undefined,
        minimumPurchase: minimum_purchase ? Number(minimum_purchase) : undefined,
        appliesTo: applies_to
      });

      if (!result.success) {
        console.error('❌ Failed to create coupon:', result.error);
        const errorResponse = NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to create coupon'
          },
          { status: 500 }
        );
        return addCorsHeaders(errorResponse);
      }

      // Extraer información de Shopify del cupón creado
      shopifyResult = {
        priceRule: {
          id: parseInt(result.coupon.shopifyPriceRuleId),
          title: description || `Cupón ${code}`,
          value_type: discount_type,
          value: discount_value,
          starts_at: valid_from || new Date().toISOString(),
          ends_at: valid_until || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        discountCode: {
          id: parseInt(result.coupon.shopifyDiscountCodeId),
          code: result.coupon.code,
          created_at: result.coupon.createdAt
        }
      };
      
      console.log('✅ Coupon created successfully with customer info');
    } else {
      // Si no hay información del cliente, crear solo en Shopify
      console.log('🏪 Creating coupon only in Shopify (no customer info)...');
      
      shopifyResult = await shopifyService.createCoupon({
        code: code.toUpperCase(),
        title: description || `Cupón ${code}`,
        discountType: discount_type as 'percentage' | 'fixed_amount',
        discountValue: Number(discount_value),
        startsAt: valid_from ? new Date(valid_from) : new Date(),
        endsAt: valid_until ? new Date(valid_until) : undefined,
        usageLimit: max_uses ? Number(max_uses) : undefined,
        oncePerCustomer: true,
        minimumPurchase: minimum_purchase ? Number(minimum_purchase) : undefined
      });

      if (!shopifyResult.priceRule || !shopifyResult.discountCode) {
        console.error('❌ Failed to create coupon in Shopify');
        const errorResponse = NextResponse.json(
          {
            success: false,
            error: 'Failed to create coupon in Shopify'
          },
          { status: 500 }
        );
        return addCorsHeaders(errorResponse);
      }
      
      console.log('✅ Coupon created in Shopify only');
    }

    // Paso 3: Si hay email del cliente, enviar notificación
    if (customer_email) {
      try {
        console.log('📧 Sending customer notification to:', customer_email);
        
        // Enviar email usando el servicio de email
        const emailSent = await emailService.sendTradeInCouponEmail(
          customer_email,
          {
            customerName: customer_name || 'Valued Customer',
            couponCode: shopifyResult.discountCode.code,
            discountValue: Number(discount_value),
            discountType: discount_type as 'percentage' | 'fixed_amount',
            expiryDate: valid_until ? new Date(valid_until) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            minimumPurchase: minimum_purchase ? Number(minimum_purchase) : undefined
          }
        );
        
        if (emailSent) {
          console.log('✅ Email notification sent successfully to:', customer_email);
        } else {
          console.log('⚠️ Email notification could not be sent to:', customer_email);
        }
        
      } catch (emailError: any) {
        console.error('⚠️ Email notification failed:', emailError.message);
        // No fallar la creación del cupón si el email falla
      }
    }

    // Respuesta exitosa con toda la información
    const responseData = {
      success: true,
      message: 'Cupón creado exitosamente en Shopify',
      data: {
        price_rule: {
          id: shopifyResult.priceRule.id,
          title: shopifyResult.priceRule.title,
          value_type: shopifyResult.priceRule.value_type,
          value: shopifyResult.priceRule.value,
          starts_at: shopifyResult.priceRule.starts_at,
          ends_at: shopifyResult.priceRule.ends_at
        },
        discount_code: {
          id: shopifyResult.discountCode.id,
          code: shopifyResult.discountCode.code,
          created_at: shopifyResult.discountCode.created_at
        },
        database_record: result?.coupon ? {
          id: result.coupon.id,
          saved: true
        } : null,
        summary: {
          code: shopifyResult.discountCode.code,
          discount_type: discount_type,
          discount_value: discount_value,
          price_rule_id: shopifyResult.priceRule.id,
          discount_code_id: shopifyResult.discountCode.id,
          created_at: shopifyResult.discountCode.created_at,
          customer_email: customer_email || null
        }
      }
    };

    console.log('✅ Webhook processed successfully');
    const successResponse = NextResponse.json(responseData);
    return addCorsHeaders(successResponse);

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    
    let errorResponse;
    
    // Manejo detallado de errores
    if (error.response?.status === 422) {
      errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Datos de cupón inválidos',
          details: error.response?.data,
          hint: 'Verifica que el código no esté duplicado y que los valores sean correctos'
        },
        { status: 422 }
      );
    } else if (error.response?.status === 401) {
      errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Token de Shopify inválido o sin permisos',
          hint: 'Verifica el access token y los permisos de la app'
        },
        { status: 401 }
      );
    } else {
      errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Error al crear cupón en Shopify',
          details: error.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }
    
    return addCorsHeaders(errorResponse);
  }
}

// GET endpoint para verificar que el webhook está funcionando
export async function GET(request: NextRequest) {
  const responseData = {
    success: true,
    message: 'Shopify Coupon Webhook Endpoint',
    status: 'Ready to receive POST requests',
    endpoint: '/api/webhook/shopify-coupon',
    cors_enabled: true,
    allowed_origin: 'https://mattressstoreslosangeles.com',
    allowed_headers: 'All headers are allowed (*)',
    required_fields: {
      code: 'string (required) - Coupon code',
      discount_value: 'number (required) - Discount value',
      discount_type: 'string (optional) - "percentage" or "fixed_amount", default: "percentage"',
      description: 'string (optional) - Coupon description',
      valid_from: 'string (optional) - Start date in ISO format',
      valid_until: 'string (optional) - End date in ISO format',
      max_uses: 'number (optional) - Maximum number of uses',
      minimum_purchase: 'number (optional) - Minimum purchase amount',
      customer_name: 'string (optional) - Customer name',
      customer_email: 'string (optional) - Customer email',
      customer_phone: 'string (optional) - Customer phone'
    },
    example_request: {
      code: 'WELCOME15',
      discount_type: 'percentage',
      discount_value: 15,
      description: 'Cupón de bienvenida Elite Sleep+',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      customer_name: 'John Doe',
      customer_email: 'john@example.com'
    }
  };
  
  const response = NextResponse.json(responseData);
  return addCorsHeaders(response);
}