//!asyncHandler is a wrapper function that lets you write asynchronous Express route handlers without using try–catch every time.
const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};



export default asyncHandler