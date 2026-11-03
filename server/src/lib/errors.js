/** Les erreurs portent un code stable : le client le traduit en français ou en anglais. */
export class ApiError extends Error {
  constructor(status, code, fields) {
    super(code);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export const notFound = () => new ApiError(404, 'not_found');
