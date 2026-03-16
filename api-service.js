
const API_BASE_URL = "/api";

window.ApiService = {
  async getProveedores() {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching proveedores:", error);
      throw error;
    }
  },

  async createProveedor(proveedor) {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proveedor),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating proveedor:", error);
      throw error;
    }
  },

  // Add more methods for other entities as needed
};
