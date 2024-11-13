console.log('App starting...');

function TestApp() {
    const [count, setCount] = React.useState(0);
    
    return (
        <div className="p-4">
            <h1 className="text-2xl">Test App</h1>
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                onClick={() => setCount(count + 1)}
            >
                Clicked {count} times
            </button>
        </div>
    );
}

ReactDOM.render(
    <TestApp />,
    document.getElementById('root')
);
