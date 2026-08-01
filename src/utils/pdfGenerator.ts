import { jsPDF } from 'jspdf';
import { UserProfile, KundaliChartData } from '../types';

export function generateKundaliPDF(
  userProfile: UserProfile,
  kundaliData: KundaliChartData,
  aiReading?: string,
  isUnknownTime?: boolean
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Colors
  const primaryColor = [30, 27, 75]; // Deep Indigo
  const accentColor = [124, 58, 237]; // Purple Accent
  const textColor = [31, 41, 55]; // Slate Gray

  // 1. Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ASTROVEDA • VEDIC JANM KUNDALI REPORT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 15, { align: 'right' });

  y = 32;

  // 2. Client Profile Card
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'F');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(userProfile.name || 'Kundali Client', 20, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const tobText = isUnknownTime
    ? `${userProfile.tob || '12:00'} (Surya Kundali Mode - Birth Time Unknown)`
    : userProfile.tob || '12:00 PM';

  doc.text(`Date of Birth: ${userProfile.dob || 'N/A'}`, 20, y + 17);
  doc.text(`Time of Birth: ${tobText}`, 20, y + 24);

  doc.text(`Place of Birth: ${userProfile.pob || 'N/A'}`, 110, y + 17);
  doc.text(`User ID: ${userProfile.id}`, 110, y + 24);

  y += 38;

  // 3. Core Astrological Pillars
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(14, y, 3, 6, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. CORE ASTROLOGICAL PILLARS', 20, y + 5);

  y += 10;

  doc.setLineWidth(0.3);
  doc.setDrawColor(209, 213, 219);

  const pillars = [
    { label: 'Ascendant (Lagna)', val: `${kundaliData.lagnaRashi} (${kundaliData.lagnaRashiHindi})` },
    { label: 'Janm Rashi (Moon)', val: `${kundaliData.moonRashi} (${kundaliData.moonRashiHindi})` },
    { label: 'Sun Sign (Surya)', val: `${kundaliData.sunRashi} (${kundaliData.sunRashiHindi})` },
    { label: 'Nakshatra & Pada', val: `${kundaliData.nakshatra} (Pada ${kundaliData.pada})` },
    { label: 'Current Mahadasha', val: kundaliData.dasha.currentMahadasha },
    { label: 'Current Antardasha', val: kundaliData.dasha.currentAntardasha }
  ];

  let col = 0;
  let rowY = y;
  pillars.forEach((p, i) => {
    const posX = col === 0 ? 14 : 110;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(posX, rowY, 82, 13, 2, 2, 'F');
    doc.roundedRect(posX, rowY, 82, 13, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(p.label, posX + 4, rowY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(p.val, posX + 4, rowY + 10);

    col++;
    if (col > 1) {
      col = 0;
      rowY += 16;
    }
  });

  y = rowY + (col !== 0 ? 16 : 4);

  // 4. Planetary Positions Table
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(14, y, 3, 6, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. GRAHA STHITI (PLANETARY DEGREES & HOUSES)', 20, y + 5);

  y += 10;

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, pageWidth - 28, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Planet', 18, y + 5);
  doc.text('Rashi (Sign)', 50, y + 5);
  doc.text('Degree', 90, y + 5);
  doc.text('House', 120, y + 5);
  doc.text('Nakshatra', 145, y + 5);
  doc.text('Status', 180, y + 5);

  y += 7;

  // Rows
  kundaliData.planets.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 249, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, y, pageWidth - 28, 6, 'F');

    doc.setFont('helvetica', p.name === 'Sun' || p.name === 'Moon' ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    doc.text(`${p.name} ${p.retrograde ? '(R)' : ''}`, 18, y + 4.5);
    doc.text(p.rashi, 50, y + 4.5);
    doc.text(p.degree, 90, y + 4.5);
    doc.text(`House ${p.house}`, 120, y + 4.5);
    doc.text(`${p.nakshatra} (P${p.pada})`, 145, y + 4.5);
    doc.text(p.status, 180, y + 4.5);

    y += 6;
  });

  y += 6;

  // 5. Dosha & Yogas Section
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(14, y, 3, 6, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. KUNDALI DOSHA & YOGA ASSESSMENT', 20, y + 5);

  y += 10;

  const doshaList = [
    {
      name: 'Manglik Yoga',
      status: kundaliData.doshas.manglik.present ? 'PRESENT' : 'ABSENT',
      desc: kundaliData.doshas.manglik.description
    },
    {
      name: 'Kaal Sarp Yoga',
      status: kundaliData.doshas.kaalSarp.present ? 'PRESENT' : 'ABSENT',
      desc: kundaliData.doshas.kaalSarp.description
    },
    {
      name: 'Shani Sade Sati',
      status: kundaliData.doshas.sadeSati.present ? 'ACTIVE' : 'INACTIVE',
      desc: kundaliData.doshas.sadeSati.description
    },
    {
      name: 'Pitra Dosha',
      status: kundaliData.doshas.pitraDosha.present ? 'OBSERVED' : 'NONE',
      desc: kundaliData.doshas.pitraDosha.description
    }
  ];

  doshaList.forEach((d) => {
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(d.name, 18, y + 6);

    const isPresent = d.status === 'PRESENT' || d.status === 'ACTIVE' || d.status === 'OBSERVED';
    doc.setTextColor(isPresent ? 185 : 16, isPresent ? 28 : 185, isPresent ? 28 : 129);
    doc.text(`[ ${d.status} ]`, 60, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const splitDesc = doc.splitTextToSize(d.desc, 115);
    doc.text(splitDesc, 90, y + 6);

    y += 13;
  });

  // 6. AI Guruji Kundali Reading (New Page if needed)
  if (aiReading) {
    doc.addPage();
    y = 20;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ASTROVEDA • GURUJI AI DEEP KUNDALI ANALYSIS', 14, 11);

    y = 26;

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, y, pageWidth - 28, 250, 3, 3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    const cleanReading = aiReading.replace(/[*#]/g, '');
    const splitReading = doc.splitTextToSize(cleanReading, pageWidth - 36);
    doc.text(splitReading, 18, y + 10);
  }

  // Save the generated PDF
  const filename = `Kundali_Report_${(userProfile.name || 'Client').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
