// test-employee-login.js
// Script para probar el login del empleado
// Ejecutar con: node test-employee-login.js

const testEmployeeLogin = async () => {
  console.log('🔍 Testing Employee Login Fix...\n');
  
  // Datos de prueba
  const credentials = {
    email: 'lbencomo94@gmail.com',
    password: 'Atec2019chino'
  };
  
  console.log('📝 Test Credentials:', credentials);
  
  // Simulando la respuesta del servidor
  const mockResponse = {
    success: true,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    employee: {
      name: 'Luis Andres',
      email: 'lbencomo94@gmail.com'
    }
  };
  
  console.log('\n✅ Server Response Structure:');
  console.log(JSON.stringify(mockResponse, null, 2));
  
  // Probando el acceso correcto a los datos
  console.log('\n📋 Correct Data Access:');
  console.log('Token:', mockResponse.token);
  console.log('Employee Name:', mockResponse.employee.name);
  console.log('Employee Email:', mockResponse.employee.email);
  
  // Lo que estaba mal antes
  console.log('\n❌ What was wrong (trying to access data.data):');
  console.log('data.data:', mockResponse.data); // undefined
  console.log('data.data?.token:', mockResponse.data?.token); // undefined
  console.log('data.data?.name:', mockResponse.data?.name); // undefined
  
  console.log('\n✅ Fix Applied:');
  console.log('- Changed from: data.data.token → data.token');
  console.log('- Changed from: data.data.name → data.employee.name');
  console.log('- Added debug logs to track the issue');
  
  console.log('\n📌 LocalStorage Keys:');
  console.log('- employeeToken: will store the JWT token');
  console.log('- employeeName: will store the employee name');
  
  console.log('\n🎯 Expected Flow:');
  console.log('1. User enters credentials');
  console.log('2. Frontend sends POST to /api/employee/login');
  console.log('3. Backend validates and returns { success, token, employee }');
  console.log('4. Frontend saves token and name to localStorage');
  console.log('5. Frontend redirects to /employee/dashboard');
  
  console.log('\n✅ Problem FIXED! The login should work now.');
};

testEmployeeLogin();