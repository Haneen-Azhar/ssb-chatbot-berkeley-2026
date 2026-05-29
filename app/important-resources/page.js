import PortalLayout from '@/components/PortalLayout';

export const metadata = {
  title: 'Important Resources - Berkeley B Summer Staff Portal',
  description: 'Important Resources',
};

export default function ImportantResourcesPage() {
  return (
    <PortalLayout
      activePage="important-resources"
      heroTitle="Important Resources"
    >
      <section className="content-section">
        <h3>Important Resources</h3>
        <div className="resource-cards">
          <a href="https://www.google.com/maps/d/edit?mid=1D__7rEn1gRsswa1uEijuOGtGyVX-vFM&usp=drive_link" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Campus Boundary Map</h4>
            </div>
          </a>
          <a href="https://drive.google.com/drive/folders/1OA5NgUouOJCX5v7bMyozz8tu_yikWOhr" target="_blank" rel="noopener noreferrer" className="resource-card card-folder">
            <span className="material-icons">folder</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Campus Tracker</h4>
            </div>
          </a>
          <a href="https://summerspringboard.com/code-of-conduct/" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Student Code of Conduct</h4>
            </div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1Xet8-GVz6LVCSxg9eVimMnKbbJ8OqDnESKbHDVreriE/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer" className="resource-card card-sheet">
            <span className="material-icons">table_chart</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Excursion Cheat-Sheets</h4>
            </div>
          </a>
          <div className="resource-card card-text">
            <span className="material-icons">label</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Icebreaker Ideas</h4>
            </div>
          </div>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdvScv2Kfcxbkh2N81ukoJLocuTXmVt1d1xrjpqX5q_Rk-IKg/viewform" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Incident Report Form</h4>
            </div>
          </a>
          <a href="https://docs.google.com/presentation/d/1BLn6hh3T4fmEmC5zuKN6I-Sz0lsgkIRA/edit?usp=drive_link&ouid=114571011226318923826&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Student Orientation Slides</h4>
            </div>
          </a>
          <a href="https://drive.google.com/drive/folders/1eThOflQMW2ILZWebxRbn94nqoOw2H33Z" target="_blank" rel="noopener noreferrer" className="resource-card card-folder">
            <span className="material-icons">folder</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Photo/Video Upload</h4>
            </div>
          </a>
          <a href="https://sites.google.com/terraeducation.com/ssbmanual2025/risk-management/managing-crisis-events?authuser=0" target="_blank" rel="noopener noreferrer" className="resource-card card-external">
            <span className="material-icons">open_in_new</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Staff Manual</h4>
            </div>
          </a>
          <a href="https://drive.google.com/drive/folders/1UcXq4UkQ-V3w3GkAxfcutyjhM54t7sr-" target="_blank" rel="noopener noreferrer" className="resource-card card-folder">
            <span className="material-icons">folder</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Student Folders</h4>
            </div>
          </a>
          <a href="https://drive.google.com/drive/folders/1PYaUlGLn8yewjHeT1FAy4HdtqQMy9zZm" target="_blank" rel="noopener noreferrer" className="resource-card card-folder">
            <span className="material-icons">folder</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Student POA&#39;s</h4>
            </div>
          </a>
          <a href="https://docs.google.com/document/d/19VUBIWyUo8CFJ7wmR925K7L1-l2vxnhR0DiZsY0zSYM" target="_blank" rel="noopener noreferrer" className="resource-card card-doc">
            <span className="material-icons">description</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Emergency Action Plan</h4>
            </div>
          </a>
          <a href="https://drive.google.com/drive/folders/1cysEGNaAk8BqTa1-b5e_zI03197gludf" target="_blank" rel="noopener noreferrer" className="resource-card card-folder">
            <span className="material-icons">folder</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Staff Binder</h4>
            </div>
          </a>
          <a href="https://drive.google.com/drive/folders/194Br-dbocb5XzIuDFHaVq_kMlZdh8n9V" target="_blank" rel="noopener noreferrer" className="resource-card card-folder">
            <span className="material-icons">folder</span>
            <div className="resource-card-content">
              <h4 className="resource-card-title">Unit 3 Campus Photos</h4>
            </div>
          </a>
        </div>
      </section>
    </PortalLayout>
  );
}
