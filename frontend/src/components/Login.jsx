import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
        if (!formData.email || !formData.password) {
            setError('Please enter email and password');
            setLoading(false);
            return;
        }

        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2e4a3e', padding: '16px' }}>
            {/* Outer box */}
            <div style={{ width: '100%', maxWidth: '1100px', background: '#fff', display: 'flex', boxShadow: '0 25px 70px rgba(0,0,0,0.45)', overflow: 'hidden', height: '88vh', maxHeight: '680px', borderRadius: '12px' }}>

                {/* LEFT — full image with subtle dark overlay */}
                <div style={{ width: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img
                        src="/iphone-wallpaper.jpeg"
                        alt="Jewellery"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                    />
                    {/* Subtle overlay for contrast */}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
                </div>

                {/* RIGHT — login form */}
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '56px 48px', position: 'relative', background: '#fff' }}>

                    {/* Brand name — top right */}
                    <div style={{ position: 'absolute', top: '28px', right: '32px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '700', fontStyle: 'italic', color: '#222', fontFamily: 'Georgia, serif', letterSpacing: '0.3px' }}>Shanmuga Jewellers</span>
                    </div>

                    {/* Form content — max width for readability */}
                    <div style={{ width: '100%', maxWidth: '420px' }}>

                        {/* Heading */}
                        <h2 style={{ fontSize: '38px', fontWeight: '800', color: '#0f0f0f', margin: '0 0 32px 0', letterSpacing: '-0.5px' }}>Login</h2>

                        {error && (
                            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', borderRadius: '4px' }}>
                                <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* EMAIL */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    required
                                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ccc', outline: 'none', fontSize: '14px', color: '#111', boxSizing: 'border-box', background: '#fff', borderRadius: '8px' }}
                                    onFocus={e => e.target.style.borderColor = '#2e4a3e'}
                                    onBlur={e => e.target.style.borderColor = '#ccc'}
                                />
                            </div>

                            {/* PASSWORD */}
                            <div style={{ marginBottom: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>Password</label>
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Your password"
                                    required
                                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ccc', outline: 'none', fontSize: '14px', color: '#111', boxSizing: 'border-box', background: '#fff', borderRadius: '8px' }}
                                    onFocus={e => e.target.style.borderColor = '#2e4a3e'}
                                    onBlur={e => e.target.style.borderColor = '#ccc'}
                                />
                            </div>

                            {/* LOGIN BUTTON */}
                            <button
                                type="submit"
                                disabled={loading}
                                onMouseEnter={e => { if (!loading) e.target.style.background = '#243d32'; }}
                                onMouseLeave={e => { if (!loading) e.target.style.background = '#2e4a3e'; }}
                                style={{ width: '100%', padding: '14px', background: loading ? '#6b7280' : '#2e4a3e', color: '#fff', border: 'none', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', borderRadius: '8px', transition: 'background 0.2s ease', boxShadow: '0 4px 14px rgba(46,74,62,0.4)' }}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
