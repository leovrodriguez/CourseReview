import { API_BASE_URL } from './config';

export const fetchAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Error fetching users: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password
      }),
    });
    if (!response.ok) {
      throw new Error(`Error creating user: ${response.statusText}`);
    }
    const data = await response.json();

    console.log("Login successful");
    localStorage.setItem("userToken", data.access_token);
    console.log("userToken:", data.access_token);
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const userLogin = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password
      }),
    });
    if (!response.ok) {
      throw new Error(`Error loggin in: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.successful) {
      console.log("Login successful");
      localStorage.setItem("userToken", data.access_token);
      console.log("userToken:", data.access_token);
    } else {
      console.log("Login failed");
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};