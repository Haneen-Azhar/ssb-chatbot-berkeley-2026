import PortalLayout from '@/components/PortalLayout';

export const metadata = {
  title: 'Schedules, Groups, & Lists - Berkeley B Summer Staff Portal',
  description: 'Schedules, Groups, & Lists',
};

export default function SchedulesPage() {
  return (
    <PortalLayout
      activePage="schedules"
      heroTitle="Schedules, Groups, & Lists"
    >
      {/* Schedules Section */}
      <section className="content-section">
        <h3>Schedules</h3>
        <div className="resource-cards">
          <a href="https://docs.google.com/spreadsheets/d/1Pr2Y_v1ftQAkfZk7-5HRS68NwYVtiybG74yTp7EREq0/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Staff Schedule/Assignments</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document/d/1sqEcnN63CuJL51uHMr_Rd5x2g1A8QJQu/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Daily Student Schedule</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1E4hCFkEwHJijvu0dflmPY-f4mKdQIeS1PNM0AyUUbZU/edit?gid=1018520504" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Master Schedule</h4>
            </div>
          </a>
        </div>
      </section>

      {/* Groups Section */}
      <section className="content-section">
        <h3>Groups</h3>
        <div className="resource-cards">
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Academic Groups</h4>
            </div>
          </div>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Clubs</h4>
            </div>
          </div>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">CRW Groups</h4>
            </div>
          </div>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Commuter List</h4>
            </div>
          </div>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Mentor Groups</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Lists/Resources Section */}
      <section className="content-section">
        <h3>Lists/Resources</h3>
        <div className="resource-cards">
          <a href="https://docs.google.com/spreadsheets/d/1GcMvhKeg62B_LObAqCCvbAAUuBd7UXHnKKr1rayLPvw/edit?gid=1327076508" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Airport List</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1p84uRzuSIElGQAOAmH818SSLEjt84oc0Wf-VkGSc_ZQ/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Master Student List</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/17zhhy4KigaEUtL0uB7ZDNaarxQgOD_qTSmVoXUfO6Uw/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Campus/Courses Supplies/Inventory Tracking List</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document/d/1gdcU6egjpsgZWih6DQRfO3mPX1az0wKE/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">First Aid Kit Restock List</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document/d/1W5iY6Z8Vu9KrdWsNoS9hEEsuMVr5nnbZ/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Student Arrival Day Check List</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Student Arrival Day Check List</h4>
            </div>
          </a>
        </div>
      </section>
    </PortalLayout>
  );
}
