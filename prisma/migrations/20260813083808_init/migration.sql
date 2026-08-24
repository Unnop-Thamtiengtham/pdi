-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INSPECTOR', 'SUPERVISOR', 'SALE', 'MASTER');

-- CreateEnum
CREATE TYPE "PdiType" AS ENUM ('INCOMING', 'LONG_TERM', 'PRE_DELIVERY');

-- CreateEnum
CREATE TYPE "PdiStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DEFECT_FOUND', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CheckResult" AS ENUM ('PASS', 'FAIL', 'REPAIRED', 'NA');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_REPAIR', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PDI_CHECKLIST', 'BATTERY_REPORT', 'VEHICLE_REPORT', 'DELIVERY_FORM', 'PDPA_CONSENT', 'LIFETIME_WARRANTY');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('IN_STOCK', 'DELIVERED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('NORMAL', 'CRITICAL');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "motorBatteryNumber" TEXT,
    "modelCode" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "colorCode" TEXT,
    "colorName" TEXT,
    "exteriorColor" TEXT,
    "interiorColor" TEXT,
    "wsDate" TIMESTAMP(3),
    "productionYear" INTEGER,
    "branchId" TEXT NOT NULL,
    "warehouse" TEXT,
    "floorplan" TEXT,
    "lotNumber" TEXT,
    "arrivedAt" TIMESTAMP(3) NOT NULL,
    "incomingDeadline" TIMESTAMP(3) NOT NULL,
    "currentStatus" "VehicleStatus" NOT NULL DEFAULT 'IN_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdiJob" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "pdiType" "PdiType" NOT NULL,
    "status" "PdiStatus" NOT NULL DEFAULT 'PENDING',
    "vehicleVin" TEXT NOT NULL,
    "inspectorId" TEXT,
    "approverId" TEXT,
    "ltmInterval" INTEGER,
    "scheduledDate" TIMESTAMP(3),
    "targetDeliveryDate" TIMESTAMP(3),
    "salesName" TEXT,
    "salesPhone" TEXT,
    "salesBranch" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "sentToRepairAt" TIMESTAMP(3),
    "repairLocation" TEXT,
    "repairNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerSig" TEXT,
    "inspectorSig" TEXT,
    "supervisorSig" TEXT,
    "pdpaConsent" BOOLEAN DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "PdiJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "modelCode" TEXT NOT NULL,
    "pdiType" "PdiType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryOrder" INTEGER NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemOrder" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "hasPhoto" BOOLEAN NOT NULL DEFAULT false,
    "hasNumeric" BOOLEAN NOT NULL DEFAULT false,
    "numericUnit" TEXT,
    "numericMin" DOUBLE PRECISION,
    "numericMax" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResult" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "result" "CheckResult" NOT NULL DEFAULT 'PASS',
    "numericValue" DOUBLE PRECISION,
    "numericValue2" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "remark" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "vehicleVin" TEXT NOT NULL,
    "defectNo" INTEGER NOT NULL,
    "checklistItemCode" TEXT,
    "description" TEXT NOT NULL,
    "cause" TEXT,
    "solution" TEXT,
    "severity" "DefectSeverity" NOT NULL DEFAULT 'NORMAL',
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "repairPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDocument" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "docType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JobDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatteryTestResult" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "mainVoltage" DOUBLE PRECISION,
    "mainSoh" DOUBLE PRECISION,
    "mainCca" DOUBLE PRECISION,
    "mainSoc" DOUBLE PRECISION,
    "secVoltage" DOUBLE PRECISION,
    "secSoh" DOUBLE PRECISION,
    "hvBatteryLevel" DOUBLE PRECISION,
    "tirePressure" DOUBLE PRECISION,
    "reportPhotoUrl" TEXT,
    "terminalCheck" TEXT,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatteryTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleEditLog" (
    "id" TEXT NOT NULL,
    "vehicleVin" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "changeDetails" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "requestBody" TEXT NOT NULL,
    "responseBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_branchId_idx" ON "Vehicle"("branchId");

-- CreateIndex
CREATE INDEX "Vehicle_lotNumber_idx" ON "Vehicle"("lotNumber");

-- CreateIndex
CREATE INDEX "Vehicle_currentStatus_idx" ON "Vehicle"("currentStatus");

-- CreateIndex
CREATE INDEX "Vehicle_arrivedAt_idx" ON "Vehicle"("arrivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PdiJob_jobNumber_key" ON "PdiJob"("jobNumber");

-- CreateIndex
CREATE INDEX "PdiJob_vehicleVin_idx" ON "PdiJob"("vehicleVin");

-- CreateIndex
CREATE INDEX "PdiJob_vehicleVin_pdiType_idx" ON "PdiJob"("vehicleVin", "pdiType");

-- CreateIndex
CREATE INDEX "PdiJob_inspectorId_idx" ON "PdiJob"("inspectorId");

-- CreateIndex
CREATE INDEX "PdiJob_approverId_idx" ON "PdiJob"("approverId");

-- CreateIndex
CREATE INDEX "PdiJob_status_idx" ON "PdiJob"("status");

-- CreateIndex
CREATE INDEX "PdiJob_pdiType_idx" ON "PdiJob"("pdiType");

-- CreateIndex
CREATE INDEX "PdiJob_createdAt_idx" ON "PdiJob"("createdAt");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_modelCode_pdiType_isActive_idx" ON "ChecklistTemplate"("modelCode", "pdiType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTemplate_modelCode_pdiType_version_key" ON "ChecklistTemplate"("modelCode", "pdiType", "version");

-- CreateIndex
CREATE INDEX "ChecklistItem_templateId_idx" ON "ChecklistItem"("templateId");

-- CreateIndex
CREATE INDEX "ChecklistResult_jobId_idx" ON "ChecklistResult"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistResult_jobId_itemId_key" ON "ChecklistResult"("jobId", "itemId");

-- CreateIndex
CREATE INDEX "Defect_jobId_idx" ON "Defect"("jobId");

-- CreateIndex
CREATE INDEX "Defect_jobId_status_idx" ON "Defect"("jobId", "status");

-- CreateIndex
CREATE INDEX "Defect_vehicleVin_idx" ON "Defect"("vehicleVin");

-- CreateIndex
CREATE INDEX "JobDocument_jobId_idx" ON "JobDocument"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "BatteryTestResult_jobId_key" ON "BatteryTestResult"("jobId");

-- CreateIndex
CREATE INDEX "VehicleEditLog_vehicleVin_idx" ON "VehicleEditLog"("vehicleVin");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_ip_key" ON "LoginAttempt"("ip");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_createdAt_idx" ON "WebhookDelivery"("webhookId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdiJob" ADD CONSTRAINT "PdiJob_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle"("vin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdiJob" ADD CONSTRAINT "PdiJob_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdiJob" ADD CONSTRAINT "PdiJob_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResult" ADD CONSTRAINT "ChecklistResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PdiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResult" ADD CONSTRAINT "ChecklistResult_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PdiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle"("vin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocument" ADD CONSTRAINT "JobDocument_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PdiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDocument" ADD CONSTRAINT "JobDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatteryTestResult" ADD CONSTRAINT "BatteryTestResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PdiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleEditLog" ADD CONSTRAINT "VehicleEditLog_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle"("vin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "WebhookSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
