import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Helper function to login as admin
async function loginAsAdmin() {
  const response = await api.post('/auth/login', {
    email: 'admin@masettiedu.com',
    password: 'admin123'
  });
  api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
}

// Test suite
async function runTests() {
  try {
    console.log('Starting admin student management tests...');

    // Login as admin
    await loginAsAdmin();
    console.log('Logged in as admin');

    // 1. List all students
    const studentsResponse = await api.get('/admin/students');
    console.log('1. List all students:');
    console.log(studentsResponse.data);

    // 2. Enroll a student in a course
    const courses = await api.get('/courses');
    const courseId = courses.data[0].id;
    const studentId = studentsResponse.data[0].id;

    const enrollmentResponse = await api.post(`/admin/students/${studentId}/enroll/${courseId}`);
    console.log('\n2. Enroll a student in a course:');
    console.log(enrollmentResponse.data);

    // 3. Attempt to enroll the same student in the same course
    try {
      await api.post(`/admin/students/${studentId}/enroll/${courseId}`);
    } catch (error) {
      console.log('\n3. Attempt to enroll student in the same course:');
      console.log(error.response.data);
    }

    // 4. Delete a student
    const deleteResponse = await api.delete(`/admin/students/${studentId}`);
    console.log('\n4. Delete a student:');
    console.log(deleteResponse.data);

    // Verify student was deleted
    const updatedStudentsResponse = await api.get('/admin/students');
    console.log('\nVerify student was deleted:');
    console.log(updatedStudentsResponse.data);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('An error occurred during testing:', error);
  }
}

runTests();
