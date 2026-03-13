import React, { useState, useRef } from 'react';
import { Camera, Mail, Phone, User, Save, X, Trash2, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar, saveAvatarUrl } from '../utils/avatarService';

const Profile = () => {
    const { user, updateUser } = useAuth();
    
    // Initial data from user context or defaults
    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file && user?.id) {
            setIsUploading(true);
            try {
                const url = await uploadAvatar(file, user.id);
                if (url) {
                    await saveAvatarUrl(user.id, url);
                    updateUser({ avatar_url: url });
                    alert('Profile picture updated!');
                }
            } catch (error) {
                console.error("Upload failed", error);
                alert('Failed to upload image.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleRemoveImage = async () => {
        if (user?.id) {
            setIsUploading(true);
            try {
                await saveAvatarUrl(user.id, null);
                updateUser({ avatar_url: null });
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                alert('Profile picture removed!');
            } catch (error) {
                alert('Failed to remove image.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveChanges = () => {
        // In a real app, you'd call an API here. 
        // For now, we'll just log and show success state.
        console.log('Saving profile data:', formData);
        alert('Changes saved successfully!');
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset to original data (mock logic)
        setFormData({
            fullName: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
        });
        setIsEditing(false);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Profile Picture & Summary */}
                <div className="w-full md:w-1/3">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-slate-50 shadow-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-5xl font-bold transition-transform duration-300 group-hover:scale-[1.02]">
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-white" size={48} />
                                ) : user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{formData.fullName.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                                
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full" onClick={() => !isUploading && fileInputRef.current?.click()}>
                                    <Camera className="text-white" size={32} />
                                </div>
                            </div>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange} 
                                className="hidden" 
                                accept="image/*"
                                disabled={isUploading}
                            />
                        </div>

                        <div className="mt-6">
                            <h3 className="text-2xl font-bold text-slate-800">{formData.fullName}</h3>
                            <p className="text-slate-500 font-medium capitalize">{user?.role || 'User'}</p>
                        </div>

                        <div className="flex items-center gap-3 mt-8 w-full">
                            {user?.avatar_url ? (
                                <>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm transition-all border border-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Upload size={16} /> Change
                                    </button>
                                    <button 
                                        onClick={handleRemoveImage}
                                        disabled={isUploading}
                                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-100 disabled:opacity-50"
                                        title="Remove Photo"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-slate-100 w-full text-left">
                            <div className="flex items-center gap-3 text-slate-600 mb-4">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Mail size={16} /></div>
                                <span className="text-sm font-medium">{formData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Phone size={16} /></div>
                                <span className="text-sm font-medium">{formData.phone || 'No phone added'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Profile Details Form */}
                <div className="w-full md:w-2/3">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Profile Information</h3>
                                <p className="text-slate-500 text-sm">Update your personal details</p>
                            </div>
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User size={16} className="text-slate-400" /> Full Name
                                    </label>
                                    <input 
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:text-slate-500"
                                        placeholder="John Doe"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Mail size={16} className="text-slate-400" /> Email Address
                                    </label>
                                    <input 
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:text-slate-500"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" /> Phone Number
                                    </label>
                                    <input 
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:text-slate-500"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex items-center gap-4 pt-4">
                                    <button 
                                        onClick={handleSaveChanges}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> Save Changes
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <X size={18} /> Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
