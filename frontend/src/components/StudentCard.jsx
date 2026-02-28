import React from 'react';

const StudentCard = ({ student }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {student.class_name || student.class}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                    <span className="font-semibold text-gray-900 block">Age</span>
                    {student.age}
                </div>
                <div>
                    <span className="font-semibold text-gray-900 block">Gender</span>
                    {student.gender}
                </div>
            </div>
        </div>
    );
};

export default StudentCard;
