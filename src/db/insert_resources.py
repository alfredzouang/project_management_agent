from sqlalchemy.orm import Session
from db.models.base_model import engine, Resource

# List of project types to insert
resources = [
    Resource(id="1", resource_name="Resource1", resource_type="human", skills=["game design", "requirements analysis"]),
    Resource(id="2", resource_name="Resource2", resource_type="human", skills=["documentation"]),
    Resource(id="3", resource_name="Resource3", resource_type="human", skills=["software architecture", "documentation"]),
    Resource(id="4", resource_name="Resource4", resource_type="human", skills=["UI/UX design", "game design"]),
    Resource(id="5", resource_name="Resource5", resource_type="human", skills=["devops", "software setup"]),
    Resource(id="6", resource_name="Resource6", resource_type="human", skills=["graphic design", "audio production"]),
    Resource(id="7", resource_name="Resource7", resource_type="human", skills=["game development", "programming"]),
    Resource(id="8", resource_name="Resource8", resource_type="human", skills=["UI development", "audio integration"]),
    Resource(id="9", resource_name="Resource9", resource_type="human", skills=["game testing", "quality assurance"]),
    Resource(id="10", resource_name="Resource10", resource_type="human", skills=["game deployment", "release management"]),
    Resource(id="11", resource_name="Resource11", resource_type="human", skills=["project management", "stakeholder communication"]),
    Resource(id="12", resource_name="Resource12", resource_type="human", skills=["QA", "game testing"]),
    Resource(id="13", resource_name="Resource13", resource_type="human", skills=["QA", "user testing"]),
    Resource(id="14", resource_name="Resource14", resource_type="human", skills=["game design", "UI/UX design"]),
    Resource(id="15", resource_name="Resource15", resource_type="human", skills=["deployment", "support", "maintenance"]),
]

# Create a new session
session = Session(bind=engine)

# Insert project types into the database
for resource in resources:
    session.add(resource)

# Commit the transaction
session.commit()

# Close the session
session.close()
