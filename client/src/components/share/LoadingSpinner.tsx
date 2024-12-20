const LoadingSpinner = ({ fill }: { fill?: string }) => {
    return (
        <div className="z-[100] inline-flex justify-center items-center h-6 gap-1">
            <div className="loading-spinner" style={{ backgroundColor: fill ? fill : "#202630", animationDelay: '50ms' }}></div>
            <div className="loading-spinner" style={{ backgroundColor: fill ? fill : "#202630", animationDelay: '100ms' }}></div>
            <div className="loading-spinner" style={{ backgroundColor: fill ? fill : "#202630", animationDelay: '150ms' }}></div>
            <div className="loading-spinner" style={{ backgroundColor: fill ? fill : "#202630", animationDelay: '200ms' }}></div>
        </div>
    );
};

export default LoadingSpinner;
