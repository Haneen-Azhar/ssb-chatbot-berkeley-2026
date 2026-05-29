import PortalLayout from '@/components/PortalLayout';

export const metadata = {
  title: 'Course-Specific Info - Berkeley B Summer Staff Portal',
  description: 'Course-Specific Info',
};

export default function CourseSpecificInfoPage() {
  return (
    <PortalLayout
      activePage="course-specific-info"
      heroTitle="Course-Specific Info"
    >
      {/* Course List */}
      <div className="course-grid">
        <div className="course-card">
          <h3>Architecture</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Astrophysics</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Biotechnology</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Design Thinking &amp; Rapid Prototyping</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Generative AI &amp; Machine Learning</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Emergency Medicine</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Neuroscience &amp; Behavioral Biology</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Nursing</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Physics &amp; Quantum Computing</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>

        <div className="course-card">
          <h3>Pre Med</h3>
          <p><strong>Instructor:</strong> TBA</p>
          <p><strong>Classroom Location:</strong> TBA</p>
          <p><strong>Instructor Phone Number:</strong></p>
        </div>
      </div>
    </PortalLayout>
  );
}
