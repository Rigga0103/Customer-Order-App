import React from 'react';

const AdminDashboard = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                    Welcome to the Admin Dashboard. This page is only accessible to users with the 'admin' role.
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h3 className="font-semibold text-red-800 text-sm uppercase tracking-wider">Total Revenue</h3>
                        <p className="text-2xl font-bold text-red-600 mt-1">$45,231.89</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-800 text-sm uppercase tracking-wider">Active Users</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-1">2,345</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h3 className="font-semibold text-green-800 text-sm uppercase tracking-wider">New Orders</h3>
                        <p className="text-2xl font-bold text-green-600 mt-1">12</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
