function successResponse(data, message = "Success") {
    return {
        success: true,
        message,
        data,
    };
}

function errorResponse(error, statusCode = 500) {
    return {
        success: false,
        message: error.message || "An error occurred",
        statusCode,
    };
}

module.exports = {
    successResponse,
    errorResponse,
};
