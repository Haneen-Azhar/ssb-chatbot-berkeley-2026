import PortalLayout from '@/components/PortalLayout';

export const metadata = {
  title: 'CD/AM/SPA Resources - Berkeley B Summer Staff Portal',
  description: 'CD/AM/SPA Resources',
};

export default function CdamspaResourcesPage() {
  return (
    <PortalLayout
      activePage="cdamspa-resources"
      heroTitle="CD/AM/SPA Resources"
    >
      {/* Administrative Resources Section */}
      <section className="content-section">
        <h3>Administrative Resources</h3>
        <div className="resource-cards">
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Buses/Transportation Info</h4>
            </div>
          </div>
          <a href="https://docs.google.com/spreadsheets/d/1ndoOAZGhDVVKuuvcrBgb7nIYBqVLXMsV/edit?usp=drive_link&ouid=114571011226318923826&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Petty Cash Log</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document/d/1PRiXUD7qcL3Sbpm8AWOtH1OA4LdES4wwvgSorD0Ikz4/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Pre-Program Training Schedule Draft 2026</h4>
            </div>
          </a>
          <a href="https://docs.google.com/presentation/d/1jwm-zShga5Zd-IJ3yCkIW71AwT6fNstaa9-6yOCUYA4/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Pre-Program Training Presentation 2026</h4>
            </div>
          </a>
          <a href="https://docs.google.com/presentation/d/1-CQVPz0iPutqH2i61kS4VK3boSFHlj0dO0H6T05KnAM/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Pre-Program Family Webinar Presentation 2026</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1BfP4yWq9SRrMQBh7wLUxyrxDNpCDEqcvCDNfIfyylSU/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">SSB HQ On-Call Emergency Contact Info</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1-M7AbIyVIJlnUeZr-t1GU6B-XK2lgfYiXFxzRsZ8o5I/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">SSB On-Campus Phone Directory--Internal Only</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document/d/1PxScsy_W7O2f0gi7CnQyh6tt2CDVmNWtKdGoDrqHhVA/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">QR Code To Important Documents</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1CoWOnRqR8dq8c5j7YqA6QHCN3LykWyDm0y0s8DEH81g/edit?usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Staff Pre-Program Survey Results</h4>
            </div>
          </a>
        </div>
      </section>

      {/* Academic/Weekend Excursions Section */}
      <section className="content-section">
        <h3>Academic/Weekend Excursions</h3>

        <h4>Saturday Excursion</h4>
        <div className="resource-cards">
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Tickets</h4>
            </div>
          </div>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Group List</h4>
            </div>
          </div>
        </div>

        <h4>Great America/Six Flags Sunday Excursion</h4>
        <div className="resource-cards">
          <a href="https://drive.google.com/file/d/1Q-dsHxr83IoT9EqLEJw03_gOz1XCeoT3/view" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Great America Code of Conduct (PDF)</h4>
            </div>
          </a>
          <a href="https://drive.google.com/file/d/1zIzCuic57J6J5GiBzRAprt4Rv2MjDBF1/view" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Great America Chaperone Registration Form (PDF)</h4>
            </div>
          </a>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Tickets</h4>
            </div>
          </div>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Group List</h4>
            </div>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}
