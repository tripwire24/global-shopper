console.log('Test file loading...');

function TestApp() {
    const [count, setCount] = React.useState(0);
    
    return (
        <div className="min-h-screen p-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Component</h1>
                    <p className="text-gray-600 mb-4">If you see this, React and Babel are working correctly!</p>
                    <button 
                        onClick={() => setCount(count + 1)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Clicked {count} times
                    </button>
                </div>
            </div>
        </div>
    );
}

// Render the app
ReactDOM.render(
    <TestApp />,
    document.getElementById('root')
);
