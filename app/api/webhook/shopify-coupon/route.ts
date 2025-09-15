import { NextRequest, NextResponse } from 'next/server';
import { shopifyService } from '@/lib/services/shopify.service';
import { couponService } from '@/lib/services/coupon.service';

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

    // Paso 1: Crear el cupón en Shopify usando el servicio existente
    const shopifyResult = await shopifyService.createCoupon({
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

    console.log('✅ Coupon created in Shopify:', {
      priceRuleId: shopifyResult.priceRule.id,
      discountCodeId: shopifyResult.discountCode.id,
      code: shopifyResult.discountCode.code
    });

    // Paso 2: Si hay información del cliente, guardar en la base de datos
    let savedCoupon = null;
    if (customer_email || customer_name) {
      try {
        console.log('💾 Saving coupon to database...');
        
        const result = await couponService.createCoupon({
          customerEmail: customer_email || '',
          customerName: customer_name || 'Guest',
          customerPhone: customer_phone,
          code: shopifyResult.discountCode.code,
          discountType: discount_type as 'percentage' | 'fixed_amount',
          discountValue: Number(discount_value),
          description: description || `Cupón ${code}`,
          validFrom: valid_from ? new Date(valid_from) : new Date(),
          validUntil: valid_until ? new Date(valid_until) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días por defecto
          maxUses: max_uses ? Number(max_uses) : undefined,
          minimumPurchase: minimum_purchase ? Number(minimum_purchase) : undefined,
          appliesTo: applies_to
        });

        if (result.success) {
          savedCoupon = result.coupon;
          console.log('✅ Coupon saved to database');
        } else {
          console.error('⚠️ Failed to save to database:', result.error);
        }
      } catch (dbError: any) {
        console.error('⚠️ Database save failed:', dbError.message);
        // No fallar la creación del cupón si la BD falla
      }
    }

    // Paso 3: Si hay email del cliente, enviar notificación
    if (customer_email) {
      try {
        console.log('📧 Sending customer notification...');
        
        // Calcular fecha de expiración legible
        const expiryDate = valid_until 
          ? new Date(valid_until).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
        
        // Formatear el valor del descuento
        const formattedDiscountValue = discount_type === 'percentage' 
          ? `${discount_value}%` 
          : `$${discount_value}`;
        
        // Aquí puedes agregar lógica para enviar email al cliente
        // usando el servicio de email que prefieras (emailService, omnisendService, etc.)
        
        // Por ahora, solo log
        console.log('📬 Email notification would be sent to:', customer_email, {
          code: shopifyResult.discountCode.code,
          discountValue: formattedDiscountValue,
          expiryDate: expiryDate
        });
        
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
        database_record: savedCoupon ? {
          id: savedCoupon.id,
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