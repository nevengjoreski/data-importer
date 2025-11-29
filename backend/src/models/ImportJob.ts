import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class ImportJob extends Model {
  public id!: number;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public total_records!: number;
  public processed_count!: number;
  public success_count!: number;
  public failed_count!: number;
  public created_at!: Date;
}

ImportJob.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    total_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    processed_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    success_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    failed_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'import_jobs',
    timestamps: false,
  }
);

export default ImportJob;
