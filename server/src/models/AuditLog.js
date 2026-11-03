import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, default: null },
    actorName: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },
    targetLabel: { type: String, default: '' },
    details: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Le journal est en ajout seul : aucune modification ni suppression n'est possible par l'application.
const refuse = function refuse() {
  throw new Error('Le journal d\'audit ne peut pas être modifié.');
};
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace', 'deleteOne', 'deleteMany', 'findOneAndDelete']) {
  auditLogSchema.pre(op, refuse);
}
auditLogSchema.pre('save', function onlyNew() {
  if (!this.isNew) refuse();
});

export const AuditLog = model('AuditLog', auditLogSchema);
