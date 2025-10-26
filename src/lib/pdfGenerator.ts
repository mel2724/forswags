import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AthleteProfile {
  full_name: string;
  position?: string;
  graduation_year?: number;
  gpa?: number;
  sport?: string;
}

interface RecruiterContact {
  name?: string;
  email?: string;
  phone?: string;
  twitter?: string;
}

interface CollegeMatch {
  rank: number;
  school_name: string;
  location: string;
  division: string;
  website?: string;
  overall_match_score: number;
  academic_fit_score: number;
  athletic_fit_score: number;
  financial_fit_score: number;
  culture_fit_score: number;
  why_good_fit: string[];
  recruiter_contact: RecruiterContact;
}

interface Recommendations {
  profile_summary: string;
  top_matches: CollegeMatch[];
  next_steps: string[];
  generated_at: string;
}

export const generatePrimeDimePDF = (
  athleteProfile: AthleteProfile,
  recommendations: Recommendations
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Colors (HSL converted to RGB for jsPDF)
  const purple: [number, number, number] = [139, 92, 246]; // hsl(258, 90%, 66%)
  const gold: [number, number, number] = [251, 191, 36]; // hsl(43, 96%, 56%)
  const darkText: [number, number, number] = [15, 23, 42]; // slate-900
  const lightText: [number, number, number] = [71, 85, 105]; // slate-600

  // Header with gradient effect (simulated with rectangle)
  doc.setFillColor(...purple);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Prime Dime Recommendations', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Personalized College Matches', pageWidth / 2, 30, { align: 'center' });

  yPos = 50;

  // Profile Summary Section
  doc.setFillColor(248, 250, 252); // bg-slate-50
  doc.rect(10, yPos, pageWidth - 20, 35, 'F');
  
  doc.setTextColor(...darkText);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(athleteProfile.full_name, 15, yPos + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  const profileLine = [
    athleteProfile.position,
    athleteProfile.sport,
    athleteProfile.graduation_year ? `Class of ${athleteProfile.graduation_year}` : null,
    athleteProfile.gpa ? `GPA: ${athleteProfile.gpa}` : null
  ].filter(Boolean).join(' • ');
  doc.text(profileLine, 15, yPos + 18);

  // Profile Summary Text
  doc.setFontSize(9);
  doc.setTextColor(...darkText);
  const summaryLines = doc.splitTextToSize(recommendations.profile_summary, pageWidth - 30);
  doc.text(summaryLines, 15, yPos + 26);

  yPos += 45;

  // Top 10 Colleges Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...purple);
  doc.text('Top 10 College Matches', 15, yPos);
  yPos += 10;

  // Loop through each college
  recommendations.top_matches.forEach((college, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // College Card Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...purple);
    doc.setLineWidth(0.5);
    doc.rect(10, yPos, pageWidth - 20, 50, 'FD');

    // Rank Badge
    doc.setFillColor(...gold);
    doc.circle(20, yPos + 8, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${college.rank}`, 20, yPos + 10, { align: 'center' });

    // School Name and Location
    doc.setTextColor(...darkText);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(college.school_name, 30, yPos + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text(`${college.location} • ${college.division}`, 30, yPos + 14);
    
    // Website URL
    if (college.website) {
      doc.setFontSize(8);
      doc.setTextColor(...purple);
      doc.text(college.website, 30, yPos + 18);
    }

    // Match Score
    doc.setFontSize(10);
    doc.setTextColor(...purple);
    doc.setFont('helvetica', 'bold');
    doc.text(`${college.overall_match_score}% Match`, pageWidth - 40, yPos + 8);

    // Fit Scores
    doc.setFontSize(8);
    doc.setTextColor(...lightText);
    doc.setFont('helvetica', 'normal');
    const fitScores = `Academic: ${college.academic_fit_score}% • Athletic: ${college.athletic_fit_score}% • Financial: ${college.financial_fit_score}% • Culture: ${college.culture_fit_score}%`;
    doc.text(fitScores, 30, college.website ? yPos + 24 : yPos + 20);

    // Why Good Fit (bullets)
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    let bulletY = college.website ? yPos + 30 : yPos + 26;
    college.why_good_fit.slice(0, 2).forEach(reason => {
      doc.text(`• ${reason}`, 30, bulletY);
      bulletY += 4;
    });

    // Recruiter Contact Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...purple);
    doc.text('Recruiter Contact:', 30, college.website ? yPos + 42 : yPos + 38);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    const contact = college.recruiter_contact;
    let contactText = [];
    if (contact.name) contactText.push(contact.name);
    if (contact.email) contactText.push(`📧 ${contact.email}`);
    if (contact.phone) contactText.push(`📞 ${contact.phone}`);
    if (contact.twitter) contactText.push(`🐦 ${contact.twitter}`);
    
    doc.text(contactText.join(' • '), 30, college.website ? yPos + 48 : yPos + 44);

    yPos += 55;
  });

  // Add new page for Next Steps if needed
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Next Steps Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...purple);
  doc.text('Next Steps', 15, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  recommendations.next_steps.forEach(step => {
    const stepLines = doc.splitTextToSize(`• ${step}`, pageWidth - 30);
    doc.text(stepLines, 20, yPos);
    yPos += stepLines.length * 5;
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(...lightText);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated by ForSWAGs Prime Dime • ${new Date(recommendations.generated_at).toLocaleDateString()}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Generate filename
  const fileName = `Prime_Dime_Recommendations_${athleteProfile.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
};
