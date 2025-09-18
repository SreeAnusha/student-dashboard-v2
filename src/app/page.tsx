"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Define the type for a single student object
interface Student {
  student_id: string;
  name: string;
  class: string;
  comprehension: number;
  attention: number;
  focus: number;
  retention: number;
  assessment_score: number;
  engagement_time: number;
  learning_persona: string;
}

// Main Dashboard Component
const StudentDashboard = () => {
  // Use the new Student type for the state
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 1. Data Fetching
  useEffect(() => {
    fetch('/student_data.json')
      .then(res => res.json())
      .then((data: Student[]) => {
        setStudents(data);
        setLoading(false);
        if (data.length > 0) {
          setSelectedStudent(data[0]);
        }
      })
      .catch(err => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

  // 2. Data Processing for Charts and Statistics
  const processedData = useMemo(() => {
    if (!students || students.length === 0) {
      return {};
    }
    
    // Calculate Averages for Overview Stats
    const totalScore = students.reduce((sum, s) => sum + s.assessment_score, 0);
    const avgScore = (totalScore / students.length).toFixed(1);

    // This is the key fix: Explicitly typing the object to satisfy TypeScript
    const avgSkills: Record<string, number> = students.reduce((acc: Record<string, number>, s) => {
      acc.comprehension += s.comprehension;
      acc.attention += s.attention;
      acc.focus += s.focus;
      acc.retention += s.retention;
      return acc;
    }, { comprehension: 0, attention: 0, focus: 0, retention: 0 });

    for (const key in avgSkills) {
      avgSkills[key] = parseFloat((avgSkills[key] / students.length).toFixed(1));
    }
    
    // Data for Bar Chart (Average Score by Persona)
    const personaData = students.reduce((acc, s) => {
      if (!acc[s.learning_persona]) {
        acc[s.learning_persona] = { totalScore: 0, count: 0 };
      }
      acc[s.learning_persona].totalScore += s.assessment_score;
      acc[s.learning_persona].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; count: number }>);

    const barChartData = Object.keys(personaData).map(persona => ({
      persona: persona,
      'Avg Score': (personaData[persona].totalScore / personaData[persona].count).toFixed(1)
    }));

    // Data for Scatter Chart (Attention vs Performance)
    const scatterChartData = students.map(s => ({
      attention: s.attention,
      score: s.assessment_score,
      persona: s.learning_persona
    }));
    
    // Data for Radar Chart (Selected Student vs Average)
    const radarData = selectedStudent ? [
      { skill: 'Comprehension', A: selectedStudent.comprehension, B: parseFloat(avgSkills.comprehension) },
      { skill: 'Attention', A: selectedStudent.attention, B: parseFloat(avgSkills.attention) },
      { skill: 'Focus', A: selectedStudent.focus, B: parseFloat(avgSkills.focus) },
      { skill: 'Retention', A: selectedStudent.retention, B: parseFloat(avgSkills.retention) },
    ] : [];

    return { avgScore, avgSkills, barChartData, scatterChartData, radarData };
  }, [students, selectedStudent]);

  const { avgScore, avgSkills, barChartData, scatterChartData, radarData } = processedData;

  // 3. Sorting and Filtering Logic for the Student Table
  const sortedStudents = useMemo(() => {
    const sortableStudents = [...students];
    if (sortConfig !== null) {
      sortableStudents.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, sortConfig, searchTerm]);

  const requestSort = (key: keyof Student) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getClassNamesFor = (key: keyof Student) => {
    if (!sortConfig) {
      return '';
    }
    return sortConfig.key === key ? sortConfig.direction : undefined;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-xl">Loading student data...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Student Cognitive Performance Dashboard</h1>
        
        {/* Overview Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-400">Avg. Score</h3>
            <p className="mt-2 text-3xl font-bold text-green-400">{avgScore}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-400">Avg. Comprehension</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-400">{avgSkills.comprehension}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-400">Avg. Attention</h3>
            <p className="mt-2 text-3xl font-bold text-red-400">{avgSkills.attention}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-gray-400">Avg. Focus</h3>
            <p className="mt-2 text-3xl font-bold text-purple-400">{avgSkills.focus}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Bar Chart: Avg Score by Persona */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Avg. Score by Learning Persona</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="persona" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#4a5568', opacity: 0.5 }} contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                <Bar dataKey="Avg Score" fill="#3b82f6" name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Chart: Attention vs Performance */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Attention vs. Assessment Score</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis type="number" dataKey="attention" name="Attention" unit="" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis type="number" dataKey="score" name="Score" unit="" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                <Legend />
                <Scatter name="Students" data={scatterChartData} fill="#82ca9d" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart: Individual Student Profile */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-12">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Student Cognitive Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="student-select" className="block text-sm font-medium text-gray-400 mb-2">Select a student:</label>
              <select
                id="student-select"
                onChange={(e) => {
                  const studentId = e.target.value;
                  const student = students.find(s => s.student_id === studentId);
                  setSelectedStudent(student || null);
                }}
                className="block w-full rounded-md border-gray-600 bg-gray-700 py-2 pl-3 pr-10 text-base text-white focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                defaultValue={students[0]?.student_id || ''}
              >
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>{s.name}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#4a5568" />
                <PolarAngleAxis dataKey="skill" stroke="#9ca3af" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#4a5568" tick={{ fill: '#9ca3af' }} />
                <Radar name={selectedStudent?.name || 'Student'} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Class Average" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Legend wrapperStyle={{ position: 'relative', bottom: -20 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Insights Section */}
        <div className="bg-gray-800 rounded-xl p-8 shadow-lg mb-12">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Key Insights</h2>
          <ul className="list-disc list-inside space-y-4 text-gray-300">
            <li>
              <span className="font-bold text-green-400">Correlation:</span>
              <p>Based on our analysis, <span className="text-yellow-400">Comprehension</span> and <span className="text-yellow-400">Attention</span> show the strongest positive correlation with Assessment Score, highlighting their critical role in academic performance. </p>
            </li>
            <li>
              <span className="font-bold text-green-400">Predictive Model:</span>
              <p>The machine learning model achieved an <span className="text-yellow-400">R-squared score of approximately 0.70</span>. This means our cognitive skills data can explain about 70% of the variance in a student&apos;s final score.</p>
            </li>
            <li>
              <span className="font-bold text-green-400">Student Personas:</span>
              <p>Students can be clustered into distinct learning personas. The <span className="text-yellow-400">&apos;High-Skill Achievers&apos;</span> group, for example, is defined by high scores across all cognitive skills and achieves the highest average assessment score.</p>
            </li>
          </ul>
        </div>

        {/* Student Table */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Student Data Table</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Class</th>
                <th 
                  className="py-3 px-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('assessment_score')}
                >
                  Assessment Score
                  <span className="ml-2">
                    {getClassNamesFor('assessment_score') === 'ascending' ? '▲' : '▼'}
                  </span>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Persona</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedStudents.map((s) => (
                <tr key={s.student_id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-200">{s.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-400">{s.class}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-400">{s.assessment_score}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-400">{s.learning_persona}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default StudentDashboard;
