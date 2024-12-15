const LoadingSpinner = () => {
    return (
        <div className="inline-flex justify-center items-center h-6 gap-1">
            <div className="loading-spinner" style={{ animationDelay: '50ms' }}></div>
            <div className="loading-spinner" style={{ animationDelay: '100ms' }}></div>
            <div className="loading-spinner" style={{ animationDelay: '150ms' }}></div>
            <div className="loading-spinner" style={{ animationDelay: '200ms' }}></div>
        </div>
    );
};

export default LoadingSpinner;
