BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Machine] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [model] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Machine_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [machineTypeId] INT,
    [machineMasterId] INT,
    CONSTRAINT [Machine_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Machine_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[MachineMaster] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [machineTypeId] INT,
    CONSTRAINT [MachineMaster_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MachineMaster_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[MachineType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [areaId] INT,
    CONSTRAINT [MachineType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MachineType_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[PreventiveType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    CONSTRAINT [PreventiveType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PreventiveType_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[MasterChecklist] (
    [id] INT NOT NULL IDENTITY(1,1),
    [preventiveTypeId] INT NOT NULL,
    [topic] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [minVal] FLOAT(53),
    [maxVal] FLOAT(53),
    [order] INT NOT NULL CONSTRAINT [MasterChecklist_order_df] DEFAULT 0,
    CONSTRAINT [MasterChecklist_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PMConfig] (
    [id] INT NOT NULL IDENTITY(1,1),
    [machineId] INT NOT NULL,
    [frequencyDays] INT NOT NULL,
    [advanceNotifyDays] INT NOT NULL,
    [lastPMDate] DATETIME2,
    [nextPMDate] DATETIME2,
    CONSTRAINT [PMConfig_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PMConfig_machineId_key] UNIQUE NONCLUSTERED ([machineId])
);

-- CreateTable
CREATE TABLE [dbo].[ChecklistTemplate] (
    [id] INT NOT NULL IDENTITY(1,1),
    [machineId] INT NOT NULL,
    [topic] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [ChecklistTemplate_type_df] DEFAULT 'BOOLEAN',
    [minVal] FLOAT(53),
    [maxVal] FLOAT(53),
    [order] INT NOT NULL CONSTRAINT [ChecklistTemplate_order_df] DEFAULT 0,
    [image] NVARCHAR(1000),
    CONSTRAINT [ChecklistTemplate_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PMRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [machineId] INT NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT [PMRecord_date_df] DEFAULT CURRENT_TIMESTAMP,
    [inspector] NVARCHAR(1000),
    [checker] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL,
    [remark] NVARCHAR(1000),
    CONSTRAINT [PMRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PMRecordDetail] (
    [id] INT NOT NULL IDENTITY(1,1),
    [recordId] INT NOT NULL,
    [checklistId] INT,
    [topic] NVARCHAR(1000),
    [isPass] BIT NOT NULL CONSTRAINT [PMRecordDetail_isPass_df] DEFAULT 0,
    [value] NVARCHAR(1000),
    [remark] NVARCHAR(1000),
    [image] NVARCHAR(max),
    CONSTRAINT [PMRecordDetail_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[UserMaster] (
    [id] INT NOT NULL IDENTITY(1,1),
    [employeeId] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UserMaster_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Area] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Area_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Area_name_key] UNIQUE NONCLUSTERED ([name])
);

-- AddForeignKey
ALTER TABLE [dbo].[Machine] ADD CONSTRAINT [Machine_machineTypeId_fkey] FOREIGN KEY ([machineTypeId]) REFERENCES [dbo].[PreventiveType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Machine] ADD CONSTRAINT [Machine_machineMasterId_fkey] FOREIGN KEY ([machineMasterId]) REFERENCES [dbo].[MachineMaster]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MachineMaster] ADD CONSTRAINT [MachineMaster_machineTypeId_fkey] FOREIGN KEY ([machineTypeId]) REFERENCES [dbo].[MachineType]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MachineType] ADD CONSTRAINT [MachineType_areaId_fkey] FOREIGN KEY ([areaId]) REFERENCES [dbo].[Area]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MasterChecklist] ADD CONSTRAINT [MasterChecklist_preventiveTypeId_fkey] FOREIGN KEY ([preventiveTypeId]) REFERENCES [dbo].[PreventiveType]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PMConfig] ADD CONSTRAINT [PMConfig_machineId_fkey] FOREIGN KEY ([machineId]) REFERENCES [dbo].[Machine]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChecklistTemplate] ADD CONSTRAINT [ChecklistTemplate_machineId_fkey] FOREIGN KEY ([machineId]) REFERENCES [dbo].[Machine]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PMRecord] ADD CONSTRAINT [PMRecord_machineId_fkey] FOREIGN KEY ([machineId]) REFERENCES [dbo].[Machine]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PMRecordDetail] ADD CONSTRAINT [PMRecordDetail_recordId_fkey] FOREIGN KEY ([recordId]) REFERENCES [dbo].[PMRecord]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PMRecordDetail] ADD CONSTRAINT [PMRecordDetail_checklistId_fkey] FOREIGN KEY ([checklistId]) REFERENCES [dbo].[MasterChecklist]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
