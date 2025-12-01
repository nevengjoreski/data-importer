import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface RecordAttributes {
  id: number;
  name: string;
  email: string;
  company: string;
  response?: any;
  status: 'pending' | 'success' | 'failed';
  job_id?: number;
  created_at?: Date;
}

interface RecordCreationAttributes extends Optional<RecordAttributes, 'id' | 'created_at' | 'status' | 'job_id' | 'response'> { }

class Record extends Model<RecordAttributes, RecordCreationAttributes> implements RecordAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public company!: string;
  public response!: any;
  public status!: 'pending' | 'success' | 'failed';
  public job_id!: number;
  public created_at!: Date;
}

Record.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'success', // Default to success for legacy/direct inserts
      allowNull: false,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'import_jobs',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'records',
    timestamps: false,
    indexes: [
      {
        fields: ['job_id'], // FK Index
      },
      {
        fields: ['job_id', 'status'], // Index for fetching pending records by job
      },
    ],
  }
);

export default Record;
