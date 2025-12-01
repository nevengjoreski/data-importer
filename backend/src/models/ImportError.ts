import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import ImportJob from './ImportJob';

class ImportError extends Model {
    public id!: number;
    public job_id!: number;
    public record_data!: string; // JSON string of the record
    public error_message!: string;
    public created_at!: Date;
}

ImportError.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        job_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: ImportJob,
                key: 'id',
            },
        },
        record_data: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        error_message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'import_errors',
        timestamps: false,
    }
);

// Define association
ImportJob.hasMany(ImportError, { foreignKey: 'job_id', as: 'errors' });
ImportError.belongsTo(ImportJob, { foreignKey: 'job_id' });

export default ImportError;
