import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            if (response.userId) {
                setUser({
                    id: response.userId,
                    email: response.email,
                    role: response.role,
                    firstName: response.firstName,
                    lastName: response.lastName,
                    isEmailVerified: response.isEmailVerified
                });
                return { success: true, role: response.role };
            }
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data || error.message || "Login failed";
            return { success: false, error: message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            return { success: true, ...response };
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data || error.message || "Registration failed";
            return { success: false, error: message };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const syncUser = () => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, syncUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
