
/****** Object:  Table [dbo].[_prisma_migrations]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[_prisma_migrations](
	[id] [varchar](36) NOT NULL,
	[checksum] [varchar](64) NOT NULL,
	[finished_at] [datetimeoffset](7) NULL,
	[migration_name] [nvarchar](250) NOT NULL,
	[logs] [nvarchar](max) NULL,
	[rolled_back_at] [datetimeoffset](7) NULL,
	[started_at] [datetimeoffset](7) NOT NULL,
	[applied_steps_count] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Area]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Area](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](1000) NOT NULL,
	[description] [nvarchar](1000) NULL,
 CONSTRAINT [Area_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ChecklistTemplate]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ChecklistTemplate](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[machineId] [int] NOT NULL,
	[topic] [nvarchar](1000) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[type] [nvarchar](1000) NOT NULL,
	[minVal] [float] NULL,
	[maxVal] [float] NULL,
	[order] [int] NOT NULL,
	[image] [nvarchar](1000) NULL,
 CONSTRAINT [ChecklistTemplate_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Machine]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Machine](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[code] [nvarchar](1000) NOT NULL,
	[name] [nvarchar](1000) NOT NULL,
	[model] [nvarchar](1000) NULL,
	[location] [nvarchar](1000) NULL,
	[image] [nvarchar](1000) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[machineMasterId] [int] NULL,
 CONSTRAINT [Machine_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MachineMaster]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MachineMaster](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[code] [nvarchar](1000) NOT NULL,
	[name] [nvarchar](1000) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[machineTypeId] [int] NULL,
 CONSTRAINT [MachineMaster_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MachinePMPlan]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MachinePMPlan](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[machineId] [int] NOT NULL,
	[preventiveTypeId] [int] NOT NULL,
	[frequencyDays] [int] NOT NULL,
	[advanceNotifyDays] [int] NOT NULL,
	[lastPMDate] [datetime2](7) NULL,
	[nextPMDate] [datetime2](7) NULL,
 CONSTRAINT [MachinePMPlan_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MachineType]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MachineType](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](1000) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[areaId] [int] NULL,
 CONSTRAINT [MachineType_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MasterChecklist]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MasterChecklist](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[preventiveTypeId] [int] NOT NULL,
	[topic] [nvarchar](1000) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[type] [nvarchar](1000) NOT NULL,
	[minVal] [float] NULL,
	[maxVal] [float] NULL,
	[order] [int] NOT NULL,
	[isRequired] [bit] NOT NULL,
	[options] [nvarchar](1000) NULL,
 CONSTRAINT [MasterChecklist_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PMRecord]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PMRecord](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[machineId] [int] NOT NULL,
	[date] [datetime2](7) NOT NULL,
	[inspector] [nvarchar](1000) NULL,
	[checker] [nvarchar](1000) NULL,
	[status] [nvarchar](1000) NOT NULL,
	[remark] [nvarchar](1000) NULL,
	[preventiveTypeId] [int] NULL,
 CONSTRAINT [PMRecord_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PMRecordDetail]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PMRecordDetail](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[recordId] [int] NOT NULL,
	[checklistId] [int] NULL,
	[topic] [nvarchar](1000) NULL,
	[isPass] [bit] NOT NULL,
	[value] [nvarchar](1000) NULL,
	[remark] [nvarchar](1000) NULL,
	[image] [nvarchar](max) NULL,
	[imageAfter] [nvarchar](max) NULL,
	[imageBefore] [nvarchar](max) NULL,
 CONSTRAINT [PMRecordDetail_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PreventiveType]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PreventiveType](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](1000) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[image] [nvarchar](1000) NULL,
 CONSTRAINT [PreventiveType_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserMaster]    Script Date: 12/7/2025 6:16:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserMaster](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[employeeId] [nvarchar](1000) NULL,
	[name] [nvarchar](1000) NOT NULL,
	[email] [nvarchar](1000) NULL,
	[role] [nvarchar](1000) NOT NULL,
 CONSTRAINT [UserMaster_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[_prisma_migrations] ([id], [checksum], [finished_at], [migration_name], [logs], [rolled_back_at], [started_at], [applied_steps_count]) VALUES (N'9f8552d4-a0bb-48e2-a662-e753c271b9b3', N'fb29ccd1dc40881b9098c0ff55f75e6f7a4e589765f5c0a7fe24b876d8715700', CAST(N'2025-12-06T00:50:34.7624993+00:00' AS DateTimeOffset), N'20251206005034_init', NULL, NULL, CAST(N'2025-12-06T00:50:34.7464822+00:00' AS DateTimeOffset), 1)
GO
SET IDENTITY_INSERT [dbo].[Area] ON 

INSERT [dbo].[Area] ([id], [name], [description]) VALUES (2, N'CLASS 100', N'Clean Room Class 100')
SET IDENTITY_INSERT [dbo].[Area] OFF
GO
SET IDENTITY_INSERT [dbo].[ChecklistTemplate] ON 

INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1311, 92, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1312, 92, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1313, 92, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1314, 92, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1315, 93, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1316, 93, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1317, 93, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1318, 93, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1319, 94, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1320, 94, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1321, 94, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1322, 94, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1323, 95, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1324, 95, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1325, 95, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1326, 95, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1327, 96, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1328, 96, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1329, 96, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1330, 96, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1331, 97, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1332, 97, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1333, 97, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1334, 97, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1335, 98, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1336, 98, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1337, 98, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1338, 98, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1339, 99, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1340, 99, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1341, 99, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1342, 99, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1343, 100, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1344, 100, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1345, 100, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1346, 100, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1347, 101, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1348, 101, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1349, 101, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1350, 101, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1351, 102, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1352, 102, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1353, 102, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1354, 102, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1355, 103, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1356, 103, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1357, 103, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1358, 103, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1359, 104, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1360, 104, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1361, 104, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1362, 104, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1363, 105, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1364, 105, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1365, 105, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1366, 105, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1367, 106, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1368, 106, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1369, 106, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1370, 106, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1371, 107, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1372, 107, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1373, 107, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1374, 107, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1375, 108, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1376, 108, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1377, 108, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1378, 108, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1379, 109, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1380, 109, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1381, 109, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1382, 109, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1383, 110, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1384, 110, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1385, 110, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1386, 110, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1387, 111, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1388, 111, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1389, 111, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1390, 111, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1391, 112, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1392, 112, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1393, 112, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1394, 112, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1395, 113, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1396, 113, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1397, 113, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1398, 113, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1399, 114, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1400, 114, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1401, 114, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1402, 114, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1403, 115, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1404, 115, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1405, 115, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1406, 115, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1407, 116, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1408, 116, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1409, 116, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
GO
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1410, 116, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1411, 117, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1412, 117, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1413, 117, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1414, 117, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1415, 118, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1416, 118, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1417, 118, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1418, 118, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1419, 119, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1420, 119, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1421, 119, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1422, 119, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1423, 120, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1424, 120, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1425, 120, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1426, 120, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1427, 121, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1428, 121, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1429, 121, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1430, 121, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1431, 122, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1432, 122, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1433, 122, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1434, 122, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1435, 123, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1436, 123, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1437, 123, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1438, 123, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1439, 124, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1440, 124, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1441, 124, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1442, 124, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1443, 125, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1444, 125, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1445, 125, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1446, 125, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1447, 126, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1448, 126, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1449, 126, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1450, 126, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1451, 127, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1452, 127, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1453, 127, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1454, 127, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1455, 128, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1456, 128, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1457, 128, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1458, 128, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1459, 129, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1460, 129, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1461, 129, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1462, 129, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1463, 130, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1464, 130, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1465, 130, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1466, 130, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1467, 131, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1468, 131, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1469, 131, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1470, 131, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1471, 132, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1472, 132, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1473, 132, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1474, 132, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1475, 133, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1476, 133, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1477, 133, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1478, 133, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1479, 134, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1480, 134, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1481, 134, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1482, 134, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1483, 135, N'1. Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1484, 135, N'2. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1485, 135, N'3. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
INSERT [dbo].[ChecklistTemplate] ([id], [machineId], [topic], [description], [type], [minVal], [maxVal], [order], [image]) VALUES (1486, 135, N'4. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, NULL)
SET IDENTITY_INSERT [dbo].[ChecklistTemplate] OFF
GO
SET IDENTITY_INSERT [dbo].[Machine] ON 

INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (92, N'052453', N'GE2-001', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T05:46:45.6590000' AS DateTime2), 1)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (93, N'052639', N'GE2-002', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 2)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (94, N'052638', N'GE2-003', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 3)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (95, N'052640', N'GE2-004', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 4)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (96, N'052641', N'GE2-005', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 5)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (97, N'054656', N'GE2-006', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 6)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (98, N'054668', N'GE2-007', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 7)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (99, N'054669', N'GE2-008', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 8)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (100, N'054657', N'GE2-009', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 9)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (101, N'057902', N'GE2-010', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 10)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (102, N'057918', N'GE2-011', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 11)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (103, N'098490', N'GE2-012', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 12)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (104, N'098491', N'GE2-013', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 13)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (105, N'099717', N'GE2-014', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 14)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (106, N'099718', N'GE2-015', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 15)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (107, N'099719', N'GE2-016', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 16)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (108, N'101375', N'GE2-017', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 17)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (109, N'101360', N'GE2-018', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 18)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (110, N'101760', N'GE2-019', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 19)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (111, N'101761', N'GE2-020', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 20)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (112, N'083878', N'GE2-021', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 21)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (113, N'105062', N'GE2-022', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 22)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (114, N'106306', N'GE2-024', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 31)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (115, N'20210702', N'GE2-025', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 32)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (116, N'200803001', N'GE2-026', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 33)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (117, N'200805003', N'GE2-028', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 34)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (118, N'103001', N'GE2-033', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 23)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (119, N'103002', N'GE2-034', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 24)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (120, N'103003', N'GE2-035', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 25)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (121, N'103004', N'GE2-036', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 26)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (122, N'103005', N'GE2-037', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 27)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (123, N'103006', N'GE2-038', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 28)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (124, N'103007', N'GE2-039', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 29)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (125, N'103008', N'GE2-040', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 30)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (126, N'112311', N'GE3-001', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 35)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (127, N'106307', N'GE3-002', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 36)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (128, N'GE3-003-NOCODE', N'GE3-003', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 37)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (129, N'200805004', N'GE3-004', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 38)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (130, N'200805005', N'GE3-005', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 39)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (131, N'200805006', N'GE3-006', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 40)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (132, N'200805007', N'GE3-007', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 41)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (133, N'130716', N'GE3-008', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 42)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (134, N'130717', N'GE3-009', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 43)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (135, N'131203', N'GE3-010', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T01:40:25.9690000' AS DateTime2), CAST(N'2025-12-06T02:51:18.1460000' AS DateTime2), 44)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (136, N'0354974', N'LSW-001', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 45)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (137, N'0354975', N'LSW-002', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 46)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (138, N'0354976', N'LSW-003', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 47)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (139, N'0346913', N'LSW-004', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 48)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (140, N'0346914', N'LSW-005', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 49)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (141, N'0341430', N'LSW-006', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 50)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (142, N'346915 WD-003', N'LSW-007', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 51)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (143, N'347896 WD-004', N'LSW-008', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 52)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (144, N'0341431', N'LSW-009', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 53)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (145, N'M190013', N'LSW-010', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 54)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (146, N'280437', N'LSW-011', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 55)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (147, N'01100134', N'LSW-012', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 56)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (148, N'5', N'LSW-013', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 57)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (149, N'01100066', N'LSW-014', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 58)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (150, N'M190018', N'LSW-015', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 59)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (151, N'LSW-016-NOCODE', N'LSW-016', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 60)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (152, N'06', N'LSW-017', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 61)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (153, N'000600053', N'LSW-018', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 62)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (154, N'0280428', N'LSW-019', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 63)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (155, N'LSW-020-NOCODE', N'LSW-020', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 64)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (156, N'04', N'LSW-021', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 65)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (157, N'01', N'LSW-024', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 66)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (158, N'100401', N'LSW-025', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 67)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (159, N'100402', N'LSW-026', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 68)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (160, N'100403', N'LSW-027', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 69)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (161, N'006', N'LSW-028', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 70)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (162, N'008', N'LSW-029', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 71)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (163, N'009', N'LSW-030', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 72)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (164, N'0512689', N'LSW-031', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 73)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (165, N'15', N'LSW-032', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 74)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (166, N'LSW-033-NOCODE', N'LSW-033', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 75)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (167, N'LSW-034-NOCODE', N'LSW-034', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 76)
INSERT [dbo].[Machine] ([id], [code], [name], [model], [location], [image], [createdAt], [updatedAt], [machineMasterId]) VALUES (168, N'LSW-035-NOCODE', N'LSW-035', N'', N'CLASS 100', NULL, CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), CAST(N'2025-12-06T06:35:34.7210000' AS DateTime2), 77)
SET IDENTITY_INSERT [dbo].[Machine] OFF
GO
SET IDENTITY_INSERT [dbo].[MachineMaster] ON 

INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (1, N'052453', N'GE2-001', N'', 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (2, N'052639', N'GE2-002', N'', 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (3, N'052638', N'GE2-003', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (4, N'052640', N'GE2-004', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (5, N'052641', N'GE2-005', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (6, N'054656', N'GE2-006', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (7, N'054668', N'GE2-007', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (8, N'054669', N'GE2-008', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (9, N'054657', N'GE2-009', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (10, N'057902', N'GE2-010', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (11, N'057918', N'GE2-011', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (12, N'098490', N'GE2-012', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (13, N'098491', N'GE2-013', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (14, N'099717', N'GE2-014', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (15, N'099718', N'GE2-015', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (16, N'099719', N'GE2-016', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (17, N'101375', N'GE2-017', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (18, N'101360', N'GE2-018', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (19, N'101760', N'GE2-019', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (20, N'101761', N'GE2-020', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (21, N'083878', N'GE2-021', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (22, N'105062', N'GE2-022', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (23, N'103001', N'GE2-033', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (24, N'103002', N'GE2-034', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (25, N'103003', N'GE2-035', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (26, N'103004', N'GE2-036', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (27, N'103005', N'GE2-037', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (28, N'103006', N'GE2-038', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (29, N'103007', N'GE2-039', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (30, N'103008', N'GE2-040', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (31, N'106306', N'GE2-024', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (32, N'20210702', N'GE2-025', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (33, N'200803001', N'GE2-026', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (34, N'200805003', N'GE2-028', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (35, N'112311', N'GE3-001', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (36, N'106307', N'GE3-002', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (37, N'GE3-003-NOCODE', N'GE3-003', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (38, N'200805004', N'GE3-004', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (39, N'200805005', N'GE3-005', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (40, N'200805006', N'GE3-006', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (41, N'200805007', N'GE3-007', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (42, N'130716', N'GE3-008', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (43, N'130717', N'GE3-009', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (44, N'131203', N'GE3-010', NULL, 1)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (45, N'0354974', N'LSW-001', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (46, N'0354975', N'LSW-002', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (47, N'0354976', N'LSW-003', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (48, N'0346913', N'LSW-004', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (49, N'0346914', N'LSW-005', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (50, N'0341430', N'LSW-006', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (51, N'346915 WD-003', N'LSW-007', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (52, N'347896 WD-004', N'LSW-008', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (53, N'0341431', N'LSW-009', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (54, N'M190013', N'LSW-010', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (55, N'280437', N'LSW-011', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (56, N'01100134', N'LSW-012', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (57, N'5', N'LSW-013', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (58, N'01100066', N'LSW-014', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (59, N'M190018', N'LSW-015', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (60, N'LSW-016-NOCODE', N'LSW-016', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (61, N'06', N'LSW-017', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (62, N'000600053', N'LSW-018', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (63, N'0280428', N'LSW-019', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (64, N'LSW-020-NOCODE', N'LSW-020', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (65, N'04', N'LSW-021', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (66, N'01', N'LSW-024', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (67, N'100401', N'LSW-025', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (68, N'100402', N'LSW-026', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (69, N'100403', N'LSW-027', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (70, N'006', N'LSW-028', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (71, N'008', N'LSW-029', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (72, N'009', N'LSW-030', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (73, N'0512689', N'LSW-031', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (74, N'15', N'LSW-032', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (75, N'LSW-033-NOCODE', N'LSW-033', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (76, N'LSW-034-NOCODE', N'LSW-034', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (77, N'LSW-035-NOCODE', N'LSW-035', NULL, 2)
INSERT [dbo].[MachineMaster] ([id], [code], [name], [description], [machineTypeId]) VALUES (78, N'UAT-01', N'UAT Machine', N'', 1)
SET IDENTITY_INSERT [dbo].[MachineMaster] OFF
GO
SET IDENTITY_INSERT [dbo].[MachinePMPlan] ON 

INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (1, 92, 1, 7, 2, CAST(N'2025-12-06T03:41:03.3680000' AS DateTime2), CAST(N'2025-12-13T02:50:57.2120000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (2, 93, 1, 7, 2, CAST(N'2025-12-06T07:40:54.9350000' AS DateTime2), CAST(N'2025-12-13T02:50:57.2310000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (3, 94, 1, 7, 2, CAST(N'2025-12-06T07:41:10.4650000' AS DateTime2), CAST(N'2025-12-13T02:50:57.2380000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (4, 95, 1, 7, 2, CAST(N'2025-12-06T09:21:35.1860000' AS DateTime2), CAST(N'2025-12-13T02:50:57.2450000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (5, 96, 1, 7, 2, CAST(N'2025-12-07T10:43:57.2630000' AS DateTime2), CAST(N'2025-12-20T02:50:57.2520000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (6, 97, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.2590000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (7, 98, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.2650000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (8, 99, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.2720000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (9, 100, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.2800000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (10, 101, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.2880000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (11, 102, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.2960000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (12, 103, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3050000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (13, 104, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3130000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (14, 105, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3190000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (15, 106, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3250000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (16, 107, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3320000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (17, 108, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3370000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (18, 109, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3430000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (19, 110, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3470000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (20, 111, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3520000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (21, 112, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3560000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (22, 113, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3600000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (23, 114, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3630000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (24, 115, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3670000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (25, 116, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3700000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (26, 117, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3740000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (27, 118, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3770000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (28, 119, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3810000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (29, 120, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3840000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (30, 121, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3900000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (31, 122, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3950000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (32, 123, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.3990000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (33, 124, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4020000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (34, 125, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4050000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (35, 126, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4080000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (36, 127, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4120000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (37, 128, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4150000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (38, 129, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4190000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (39, 130, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4230000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (40, 131, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4260000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (41, 132, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4300000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (42, 133, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4340000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (43, 134, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4370000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (44, 135, 1, 7, 2, NULL, CAST(N'2025-12-06T02:50:57.4400000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (45, 92, 2, 25, 7, CAST(N'2025-12-06T03:41:26.9340000' AS DateTime2), CAST(N'2026-01-05T02:51:18.1490000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (46, 93, 2, 30, 7, CAST(N'2025-12-06T08:55:00.5740000' AS DateTime2), CAST(N'2026-07-04T02:51:18.1570000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (47, 94, 2, 30, 7, CAST(N'2025-12-07T10:44:53.8170000' AS DateTime2), CAST(N'2026-01-05T02:51:18.1670000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (48, 95, 2, 30, 7, CAST(N'2025-12-06T09:20:47.2080000' AS DateTime2), CAST(N'2026-02-04T02:51:18.1770000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (49, 96, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.1870000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (50, 97, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.1960000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (51, 98, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2070000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (52, 99, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2150000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (53, 100, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2240000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (54, 101, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2330000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (55, 102, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2410000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (56, 103, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2480000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (57, 104, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2550000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (58, 105, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2600000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (59, 106, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2670000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (60, 107, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2740000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (61, 108, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2820000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (62, 109, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2890000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (63, 110, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.2940000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (64, 111, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3020000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (65, 112, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3080000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (66, 113, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3150000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (67, 114, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3190000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (68, 115, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3240000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (69, 116, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3280000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (70, 117, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3320000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (71, 118, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3360000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (72, 119, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3400000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (73, 120, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3440000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (74, 121, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3480000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (75, 122, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3520000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (76, 123, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3560000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (77, 124, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3590000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (78, 125, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3630000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (79, 126, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3670000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (80, 127, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3710000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (81, 128, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3740000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (82, 129, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3780000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (83, 130, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3820000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (84, 131, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3850000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (85, 132, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3880000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (86, 133, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3920000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (87, 134, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.3960000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (88, 135, 2, 30, 7, NULL, CAST(N'2025-12-06T02:51:18.4020000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (90, 136, 4, 30, 7, CAST(N'2025-12-06T09:25:36.3240000' AS DateTime2), CAST(N'2026-01-05T06:35:34.7350000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (91, 137, 4, 30, 7, CAST(N'2025-12-07T10:48:32.4440000' AS DateTime2), CAST(N'2026-01-05T06:35:34.7520000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (92, 138, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.7600000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (93, 139, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.7690000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (94, 140, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.7760000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (95, 141, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.7840000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (96, 142, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.7910000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (97, 143, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.7980000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (98, 144, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8050000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (99, 145, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8160000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (100, 146, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8250000' AS DateTime2))
GO
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (101, 147, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8360000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (102, 148, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8430000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (103, 149, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8510000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (104, 150, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8600000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (105, 151, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8670000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (106, 152, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8750000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (107, 153, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8810000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (108, 154, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8860000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (109, 155, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8920000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (110, 156, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.8970000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (111, 157, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9010000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (112, 158, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9060000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (113, 159, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9120000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (114, 160, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9170000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (115, 161, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9210000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (116, 162, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9270000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (117, 163, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9320000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (118, 164, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9370000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (119, 165, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9420000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (120, 166, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9480000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (121, 167, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9520000' AS DateTime2))
INSERT [dbo].[MachinePMPlan] ([id], [machineId], [preventiveTypeId], [frequencyDays], [advanceNotifyDays], [lastPMDate], [nextPMDate]) VALUES (122, 168, 4, 30, 7, NULL, CAST(N'2025-12-06T06:35:34.9570000' AS DateTime2))
SET IDENTITY_INSERT [dbo].[MachinePMPlan] OFF
GO
SET IDENTITY_INSERT [dbo].[MachineType] ON 

INSERT [dbo].[MachineType] ([id], [name], [description], [areaId]) VALUES (1, N'Oil Fill Machine', N'', 2)
INSERT [dbo].[MachineType] ([id], [name], [description], [areaId]) VALUES (2, N'Laser Welding Machine', N'', 2)
SET IDENTITY_INSERT [dbo].[MachineType] OFF
GO
SET IDENTITY_INSERT [dbo].[MasterChecklist] ON 

INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (1, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (2, 1, N'2. Turn Table', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (3, 1, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (4, 1, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (5, 1, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (6, 1, N'6. Cover Chamber (ฝาครอบ)', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (7, 1, N'7. LED Mounting ( ที่ยึด LED )', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (8, 1, N'8. Oil Tube ( สาย Oil )', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (9, 1, N'9. Check the position of the oil tube in chamber', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (10, 1, N'10. Check Ventilation time (30-40 Sec)', NULL, N'NUMERIC', 30, 40, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (11, 2, N'Oil Type', NULL, N'DROPDOWN', NULL, NULL, 0, 1, N'M1270,M2548,M1253')
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (12, 2, N'1. Vial 1', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (13, 2, N'2. Vial 2', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (14, 2, N'3. Vial 3', NULL, N'BOOLEAN', NULL, NULL, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (16, 4, N'Controller S/N', NULL, N'TEXT', NULL, NULL, 0, 0, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (17, 4, N'Head', NULL, N'DROPDOWN', NULL, NULL, 0, 1, N'A,B')
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (18, 4, N'Controller Model', NULL, N'DROPDOWN', NULL, NULL, 0, 1, N'MD-E-5000,MD-H-201,MD-E-3020')
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (19, 4, N'Dispenser Head SN#', NULL, N'TEXT', NULL, NULL, 0, 0, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (20, 4, N'1. Voltage (xx-yy V)', NULL, N'NUMERIC', 0, 100.1, 0, 1, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (21, 4, N'2. Pulse width (um)', NULL, N'NUMERIC', 0, 100.5, 0, 0, NULL)
INSERT [dbo].[MasterChecklist] ([id], [preventiveTypeId], [topic], [description], [type], [minVal], [maxVal], [order], [isRequired], [options]) VALUES (22, 4, N'3. Temperature ( C )', NULL, N'NUMERIC', 0, 100.5, 0, 1, NULL)
SET IDENTITY_INSERT [dbo].[MasterChecklist] OFF
GO
SET IDENTITY_INSERT [dbo].[PMRecord] ON 

INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (1, 92, CAST(N'2025-12-06T02:23:47.3410000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', NULL)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (2, 92, CAST(N'2025-12-06T03:41:03.3180000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 1)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (3, 92, CAST(N'2025-12-06T03:41:26.9180000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (4, 93, CAST(N'2025-12-06T07:40:54.8950000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 1)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (5, 94, CAST(N'2025-12-06T07:41:10.4380000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 1)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (9, 93, CAST(N'2025-12-06T08:29:52.2610000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (11, 93, CAST(N'2025-12-06T08:31:48.0650000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (12, 93, CAST(N'2025-12-06T08:55:00.5430000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (13, 95, CAST(N'2025-12-06T09:01:10.4630000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (14, 95, CAST(N'2025-12-06T09:20:47.1880000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (15, 95, CAST(N'2025-12-06T09:21:35.1580000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 1)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (16, 136, CAST(N'2025-12-06T09:25:36.2990000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 4)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (17, 96, CAST(N'2025-12-06T15:48:53.1460000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 1)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (18, 96, CAST(N'2025-12-07T10:43:57.2310000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'COMPLETED', N'', 1)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (19, 94, CAST(N'2025-12-07T10:44:53.7360000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'LATE', N'', 2)
INSERT [dbo].[PMRecord] ([id], [machineId], [date], [inspector], [checker], [status], [remark], [preventiveTypeId]) VALUES (20, 137, CAST(N'2025-12-07T10:48:32.4170000' AS DateTime2), N'Apiwat Nonut (LE114)', N'Apiwat Nonut (LE114)', N'LATE', N'', 4)
SET IDENTITY_INSERT [dbo].[PMRecord] OFF
GO
SET IDENTITY_INSERT [dbo].[PMRecordDetail] ON 

INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (1, 1, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (2, 1, 2, N'2. Turn Table', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (3, 1, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (4, 1, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (5, 1, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (6, 1, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (7, 1, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (8, 1, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (9, 1, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (10, 1, 10, N'10. Check Ventilation time (30-40 Sec)', 1, N'33', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (11, 2, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (12, 2, 2, N'2. Turn Table', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (13, 2, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (14, 2, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (15, 2, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (16, 2, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (17, 2, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (18, 2, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (19, 2, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (20, 2, 10, N'10. Check Ventilation time (30-40 Sec)', 1, N'39', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (21, 3, 11, N'1. Oil Type', 1, N'M1270', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (22, 3, 12, N'2. Vial 1', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (23, 3, 13, N'3. Vial 2', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (24, 3, 14, N'4. Vial 3', 1, N'', N'', N'', NULL, NULL)
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (25, 4, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (26, 4, 2, N'2. Turn Table', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (27, 4, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (28, 4, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (29, 4, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (30, 4, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (31, 4, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (32, 4, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (33, 4, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (34, 4, 10, N'10. Check Ventilation time (30-40 Sec)', 1, N'35', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (35, 5, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (36, 5, 2, N'2. Turn Table', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (37, 5, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (38, 5, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (39, 5, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (40, 5, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (41, 5, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (42, 5, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (43, 5, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (44, 5, 10, N'10. Check Ventilation time (30-40 Sec)', 1, N'33', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (61, 9, 11, N'Oil Type', 1, N'M2548', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (62, 9, 12, N'1. Vial 1', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (63, 9, 13, N'2. Vial 2', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (64, 9, 14, N'3. Vial 3', 0, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (69, 11, 11, N'Oil Type', 1, N'M1270', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (70, 11, 12, N'1. Vial 1', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (71, 11, 13, N'2. Vial 2', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (72, 11, 14, N'3. Vial 3', 0, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (73, 12, 11, N'Oil Type', 1, N'M1270', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (74, 12, 12, N'1. Vial 1', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (75, 12, 13, N'2. Vial 2', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (76, 12, 14, N'3. Vial 3', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (77, 13, 11, N'Oil Type', 1, N'M1270', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (78, 13, 12, N'1. Vial 1', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (79, 13, 13, N'2. Vial 2', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (80, 13, 14, N'3. Vial 3', 0, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (81, 14, 11, N'Oil Type', 1, N'M1270', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (82, 14, 12, N'1. Vial 1', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (83, 14, 13, N'2. Vial 2', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (84, 14, 14, N'3. Vial 3', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (85, 15, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (86, 15, 2, N'2. Turn Table', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (87, 15, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (88, 15, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (89, 15, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (90, 15, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (91, 15, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (92, 15, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (93, 15, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (94, 15, 10, N'10. Check Ventilation time (30-40 Sec)', 1, N'32', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (95, 16, 16, N'Controller S/N', 1, N'AKNAAKNA', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (96, 16, 17, N'Head', 1, N'B', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (97, 16, 18, N'Controller Model', 1, N'MD-E-5000', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (98, 16, 19, N'Dispenser Head SN#', 1, N'AAAJGHAGHA', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (99, 16, 20, N'1. Voltage (xx-yy V)', 1, N'100', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (100, 16, 21, N'2. Pulse width (um)', 1, N'100', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (101, 16, 22, N'3. Temperature ( C )', 1, N'100', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (102, 17, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (103, 17, 2, N'2. Turn Table', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (104, 17, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (105, 17, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (106, 17, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (107, 17, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (108, 17, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (109, 17, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (110, 17, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (111, 17, 10, N'10. Check Ventilation time (30-40 Sec)', 0, N'55', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (112, 18, 1, N'1. Surface Area In Chamber (บริเวณผิวใน Chamber)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (113, 18, 2, N'2. Turn Table', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (114, 18, 3, N'3. Oil Splash swamp ( หลุมกัน Oil กระจาย )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (115, 18, 4, N'4. Dispenser Mounting ( ที่ยึด Dispenser Head )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (116, 18, 5, N'5.Tank outlet ( ท่อ Air Purge ใน Chamber )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (117, 18, 6, N'6. Cover Chamber (ฝาครอบ)', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (118, 18, 7, N'7. LED Mounting ( ที่ยึด LED )', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (119, 18, 8, N'8. Oil Tube ( สาย Oil )', 1, N'', N'', N'', N'', N'')
GO
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (120, 18, 9, N'9. Check the position of the oil tube in chamber', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (121, 18, 10, N'10. Check Ventilation time (30-40 Sec)', 1, N'33', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (122, 19, 11, N'Oil Type', 1, N'M1270', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (123, 19, 12, N'1. Vial 1', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (124, 19, 13, N'2. Vial 2', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (125, 19, 14, N'3. Vial 3', 1, N'', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (126, 20, 16, N'Controller S/N', 1, N'AHghsfajgvf', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (127, 20, 17, N'Head', 1, N'A', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (128, 20, 18, N'Controller Model', 1, N'MD-E-5000', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (129, 20, 19, N'Dispenser Head SN#', 1, N'fdsfds', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (130, 20, 20, N'1. Voltage (xx-yy V)', 1, N'100', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (131, 20, 21, N'2. Pulse width (um)', 1, N'100', N'', N'', N'', N'')
INSERT [dbo].[PMRecordDetail] ([id], [recordId], [checklistId], [topic], [isPass], [value], [remark], [image], [imageAfter], [imageBefore]) VALUES (132, 20, 22, N'3. Temperature ( C )', 1, N'100', N'', N'', N'', N'')
SET IDENTITY_INSERT [dbo].[PMRecordDetail] OFF
GO
SET IDENTITY_INSERT [dbo].[PreventiveType] ON 

INSERT [dbo].[PreventiveType] ([id], [name], [description], [image]) VALUES (1, N'Check Sheet Cleaning', N'Use fro Oil Fil', N'/uploads/1764985315779-207738121.png')
INSERT [dbo].[PreventiveType] ([id], [name], [description], [image]) VALUES (2, N'Change Oil', N'', N'')
INSERT [dbo].[PreventiveType] ([id], [name], [description], [image]) VALUES (4, N'Laser Record Parameter', N'', N'')
INSERT [dbo].[PreventiveType] ([id], [name], [description], [image]) VALUES (5, N'Laser Sensor Parameter', N'', N'')
SET IDENTITY_INSERT [dbo].[PreventiveType] OFF
GO
SET IDENTITY_INSERT [dbo].[UserMaster] ON 

INSERT [dbo].[UserMaster] ([id], [employeeId], [name], [email], [role]) VALUES (1, N'LE114', N'Apiwat Nonut', N'apiwat.n@minebea.co.th', N'BOTH')
SET IDENTITY_INSERT [dbo].[UserMaster] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [Area_name_key]    Script Date: 12/7/2025 6:16:43 PM ******/
ALTER TABLE [dbo].[Area] ADD  CONSTRAINT [Area_name_key] UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [Machine_code_key]    Script Date: 12/7/2025 6:16:43 PM ******/
ALTER TABLE [dbo].[Machine] ADD  CONSTRAINT [Machine_code_key] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [MachineMaster_code_key]    Script Date: 12/7/2025 6:16:43 PM ******/
ALTER TABLE [dbo].[MachineMaster] ADD  CONSTRAINT [MachineMaster_code_key] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [MachinePMPlan_machineId_preventiveTypeId_key]    Script Date: 12/7/2025 6:16:43 PM ******/
ALTER TABLE [dbo].[MachinePMPlan] ADD  CONSTRAINT [MachinePMPlan_machineId_preventiveTypeId_key] UNIQUE NONCLUSTERED 
(
	[machineId] ASC,
	[preventiveTypeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [MachineType_name_key]    Script Date: 12/7/2025 6:16:43 PM ******/
ALTER TABLE [dbo].[MachineType] ADD  CONSTRAINT [MachineType_name_key] UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [PreventiveType_name_key]    Script Date: 12/7/2025 6:16:43 PM ******/
ALTER TABLE [dbo].[PreventiveType] ADD  CONSTRAINT [PreventiveType_name_key] UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[_prisma_migrations] ADD  DEFAULT (getdate()) FOR [started_at]
GO
ALTER TABLE [dbo].[_prisma_migrations] ADD  DEFAULT ((0)) FOR [applied_steps_count]
GO
ALTER TABLE [dbo].[ChecklistTemplate] ADD  CONSTRAINT [ChecklistTemplate_type_df]  DEFAULT ('BOOLEAN') FOR [type]
GO
ALTER TABLE [dbo].[ChecklistTemplate] ADD  CONSTRAINT [ChecklistTemplate_order_df]  DEFAULT ((0)) FOR [order]
GO
ALTER TABLE [dbo].[Machine] ADD  CONSTRAINT [Machine_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[MasterChecklist] ADD  CONSTRAINT [MasterChecklist_order_df]  DEFAULT ((0)) FOR [order]
GO
ALTER TABLE [dbo].[MasterChecklist] ADD  CONSTRAINT [MasterChecklist_isRequired_df]  DEFAULT ((0)) FOR [isRequired]
GO
ALTER TABLE [dbo].[PMRecord] ADD  CONSTRAINT [PMRecord_date_df]  DEFAULT (getdate()) FOR [date]
GO
ALTER TABLE [dbo].[PMRecordDetail] ADD  CONSTRAINT [PMRecordDetail_isPass_df]  DEFAULT ((0)) FOR [isPass]
GO
ALTER TABLE [dbo].[ChecklistTemplate]  WITH CHECK ADD  CONSTRAINT [ChecklistTemplate_machineId_fkey] FOREIGN KEY([machineId])
REFERENCES [dbo].[Machine] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ChecklistTemplate] CHECK CONSTRAINT [ChecklistTemplate_machineId_fkey]
GO
ALTER TABLE [dbo].[Machine]  WITH CHECK ADD  CONSTRAINT [Machine_machineMasterId_fkey] FOREIGN KEY([machineMasterId])
REFERENCES [dbo].[MachineMaster] ([id])
GO
ALTER TABLE [dbo].[Machine] CHECK CONSTRAINT [Machine_machineMasterId_fkey]
GO
ALTER TABLE [dbo].[MachineMaster]  WITH CHECK ADD  CONSTRAINT [MachineMaster_machineTypeId_fkey] FOREIGN KEY([machineTypeId])
REFERENCES [dbo].[MachineType] ([id])
ON UPDATE CASCADE
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[MachineMaster] CHECK CONSTRAINT [MachineMaster_machineTypeId_fkey]
GO
ALTER TABLE [dbo].[MachinePMPlan]  WITH CHECK ADD  CONSTRAINT [MachinePMPlan_machineId_fkey] FOREIGN KEY([machineId])
REFERENCES [dbo].[Machine] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MachinePMPlan] CHECK CONSTRAINT [MachinePMPlan_machineId_fkey]
GO
ALTER TABLE [dbo].[MachinePMPlan]  WITH CHECK ADD  CONSTRAINT [MachinePMPlan_preventiveTypeId_fkey] FOREIGN KEY([preventiveTypeId])
REFERENCES [dbo].[PreventiveType] ([id])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[MachinePMPlan] CHECK CONSTRAINT [MachinePMPlan_preventiveTypeId_fkey]
GO
ALTER TABLE [dbo].[MachineType]  WITH CHECK ADD  CONSTRAINT [MachineType_areaId_fkey] FOREIGN KEY([areaId])
REFERENCES [dbo].[Area] ([id])
ON UPDATE CASCADE
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[MachineType] CHECK CONSTRAINT [MachineType_areaId_fkey]
GO
ALTER TABLE [dbo].[MasterChecklist]  WITH CHECK ADD  CONSTRAINT [MasterChecklist_preventiveTypeId_fkey] FOREIGN KEY([preventiveTypeId])
REFERENCES [dbo].[PreventiveType] ([id])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[MasterChecklist] CHECK CONSTRAINT [MasterChecklist_preventiveTypeId_fkey]
GO
ALTER TABLE [dbo].[PMRecord]  WITH CHECK ADD  CONSTRAINT [PMRecord_machineId_fkey] FOREIGN KEY([machineId])
REFERENCES [dbo].[Machine] ([id])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[PMRecord] CHECK CONSTRAINT [PMRecord_machineId_fkey]
GO
ALTER TABLE [dbo].[PMRecord]  WITH CHECK ADD  CONSTRAINT [PMRecord_preventiveTypeId_fkey] FOREIGN KEY([preventiveTypeId])
REFERENCES [dbo].[PreventiveType] ([id])
ON UPDATE CASCADE
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[PMRecord] CHECK CONSTRAINT [PMRecord_preventiveTypeId_fkey]
GO
ALTER TABLE [dbo].[PMRecordDetail]  WITH CHECK ADD  CONSTRAINT [PMRecordDetail_checklistId_fkey] FOREIGN KEY([checklistId])
REFERENCES [dbo].[MasterChecklist] ([id])
GO
ALTER TABLE [dbo].[PMRecordDetail] CHECK CONSTRAINT [PMRecordDetail_checklistId_fkey]
GO
ALTER TABLE [dbo].[PMRecordDetail]  WITH CHECK ADD  CONSTRAINT [PMRecordDetail_recordId_fkey] FOREIGN KEY([recordId])
REFERENCES [dbo].[PMRecord] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PMRecordDetail] CHECK CONSTRAINT [PMRecordDetail_recordId_fkey]
GO

