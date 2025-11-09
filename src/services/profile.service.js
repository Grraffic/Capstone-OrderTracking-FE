import api from "./api";

/**
 * Profile Service
 *
 * Handles all profile-related API calls including:
 * - Fetching profile data
 * - Updating profile information
 * - Uploading profile images via backend
 */
class ProfileService {
  /**
   * Get current user profile
   * @returns {Promise<Object>} Profile data
   */
  async getProfile() {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }

  /**
   * Update user profile
   * @param {Object} data - Profile data to update
   * @param {string} data.name - User's full name
   * @param {string} data.photoURL - Profile image URL
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(data) {
    try {
      const response = await api.put("/auth/profile", data);
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }

  /**
   * Upload profile image via backend
   * @param {File} file - Image file to upload
   * @returns {Promise<string>} Public URL of uploaded image
   */
  async uploadProfileImage(file) {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);

      // Send to backend
      const response = await api.post("/auth/profile/upload-image", {
        image: base64,
        fileName: file.name,
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error("Upload profile image error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to upload profile image"
      );
    }
  }

  /**
   * Convert file to base64
   * @param {File} file - File to convert
   * @returns {Promise<string>} Base64 string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const profileService = new ProfileService();
