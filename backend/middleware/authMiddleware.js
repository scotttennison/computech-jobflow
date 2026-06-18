// Middleware to check if user is logged in
function requireLogin(request, response, next) {
  // Check: Is there a user in the session?
  if (!request.session.user) {
    return response.status(401).json({
      error: 'You must be logged in',
    });
  }

  // User is logged in, continue to the next endpoint
  next();
}

// Export the middleware
module.exports = requireLogin;