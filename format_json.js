const jsonFormatSuccess = (results) => {
  return {
    success: 1,
    data: results
  };
};

const jsonFormatError = (code, message) => {
  return {
    success: 0,
    error_code: code,
    error_message: message
  };
};

module.exports = {
  jsonFormatSuccess,
  jsonFormatError
};