CREATE TABLE IF NOT EXISTS "active_rating_values" (
    "(Do Not Modify) Rating Value" TEXT,
    "(Do Not Modify) Row Checksum" TEXT,
    "(Do Not Modify) Modified On" TEXT,
    "Skill" TEXT,
    "Name" TEXT,
    "Range" TEXT,
    "Rating Model" TEXT,
    "Value" TEXT,
    "Is Default" TEXT
);

CREATE TABLE IF NOT EXISTS "consultant" (
    "VendorConsultantId" TEXT,
    "Consultant ITcode" TEXT,
    "Vendor Name(CN)" TEXT,
    "Vendor Name(EN)" TEXT,
    "Consultant Name" TEXT,
    "ID Card" TEXT,
    "Status" TEXT,
    "Base" TEXT,
    "Base Country" TEXT,
    "Telephone" TEXT,
    "Email" TEXT,
    "Valid Date" TEXT,
    "Remark" TEXT,
    "Skill Model" TEXT,
    "Skill Model Status" TEXT,
    "Experience" TEXT,
    "K Level" TEXT,
    "Currency" TEXT,
    "Rate" TEXT,
    "Approve Status" TEXT,
    "Onboard Status" TEXT,
    "Integrity Statement" TEXT,
    "Resume No." TEXT,
    "Working Hours" TEXT,
    "ITcode Status" TEXT,
    "Account Type" TEXT,
    "Manager" TEXT,
    "T3 Org" TEXT
);

CREATE TABLE IF NOT EXISTS "workexresume" (
    "ItemNo" TEXT,
    "Name" TEXT,
    "Status" TEXT,
    "Company" TEXT,
    "JobTitle" TEXT,
    "StartDate" TEXT,
    "EndDate" TEXT,
    "Description" TEXT
);

CREATE TABLE IF NOT EXISTS "resume" (
    "PR" TEXT,
    "ItemNo" TEXT,
    "Name" TEXT,
    "Status" TEXT,
    "Company" TEXT,
    "JobTitle" TEXT,
    "Start" TEXT,
    "End" TEXT,
    "Description" TEXT
);

CREATE TABLE IF NOT EXISTS "purchase_requirement" (
    "(Do Not Modify) Purchase Request" TEXT,
    "(Do Not Modify) Row Checksum" TEXT,
    "(Do Not Modify) Modified On" TIMESTAMP,
    "PR Code" TEXT,
    "PR Type" TEXT,
    "PR Title" TEXT,
    "PR Category" TEXT,
    "PR Sub Category" TEXT,
    "Creator" TEXT,
    "Requestor" TEXT,
    "Platform (Requestor) (User)" TEXT,
    "Business Unit (Requestor) (User)" TEXT,
    "Service Location/Ship To" TEXT,
    "Start Date" TIMESTAMP,
    "End Date" TIMESTAMP,
    "Total Amount (Selected currency) (Excl.Tax)" REAL,
    "Total Amount (USD) (Excl.tax)" REAL,
    "Approval Status" TEXT,
    "Submitted Date" TIMESTAMP,
    "Created On" TIMESTAMP,
    "K-Level" TEXT,
    "Skill Required (must to have)" TEXT,
    "Skill Required (nice to have)" TEXT,
    "Skill" TEXT
);

CREATE TABLE IF NOT EXISTS project (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR,
    description VARCHAR
);

CREATE TABLE IF NOT EXISTS project_task (
    id INTEGER NOT NULL PRIMARY KEY,
    project_id INTEGER,
    name VARCHAR,
    description VARCHAR
);

CREATE TABLE IF NOT EXISTS project_type (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR
);

CREATE TABLE IF NOT EXISTS "resource" (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR,
    type VARCHAR
);

CREATE TABLE IF NOT EXISTS resource_plan (
    id INTEGER NOT NULL PRIMARY KEY,
    resource_id INTEGER,
    project_id INTEGER,
    allocation VARCHAR
);
