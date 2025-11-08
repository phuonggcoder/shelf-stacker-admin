// Catch unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = {
    handleUnhandledRejection: (server) => {
        process.on('unhandledRejection', (err) => {
            console.error('❌ Unhandled Rejection:', err);
            server.close(() => process.exit(1));
        });
    },
    
    handleUncaughtException: (server) => {
        process.on('uncaughtException', (err) => {
            console.error('❌ Uncaught Exception:', err);
            server.close(() => process.exit(1));
        });
    }
};