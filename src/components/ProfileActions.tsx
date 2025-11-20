import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Share2, QrCode, FileDown, Copy, Download } from "lucide-react";
import QRCodeLib from "qrcode";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileActionsProps {
  athleteId: string;
  athleteName: string;
  athleteUsername?: string;
  onGeneratePDF?: () => void;
}

export const ProfileActions = ({ athleteId, athleteName, athleteUsername, onGeneratePDF }: ProfileActionsProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isQROpen, setIsQROpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const publicProfileUrl = `${window.location.origin}/athlete/${athleteUsername || athleteId}`;

  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(publicProfileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
      setIsQROpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `${athleteName.replace(/\s+/g, '-')}-profile-qr.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success('QR code downloaded!');
  };

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      toast.success('Profile link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athleteName} - ForSWAGs Profile`,
          text: `Check out ${athleteName}'s athlete profile on ForSWAGs`,
          url: publicProfileUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        copyProfileLink();
      }
    } else {
      copyProfileLink();
    }
  };

  const exportToPDF = async () => {
    setGeneratingPDF(true);
    try {
      // Create a new window with the public profile
      const printWindow = window.open(`/athlete/${athleteUsername || athleteId}`, '_blank');
      
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        return;
      }

      // Wait for the page to load
      printWindow.addEventListener('load', async () => {
        setTimeout(async () => {
          try {
            const content = printWindow.document.body;
            
            // Capture the page as image
            const imgData = await toPng(content, {
              quality: 1.0,
              pixelRatio: 2,
            });

            // Create a temporary image to get dimensions
            const img = new Image();
            img.src = imgData;
            await new Promise(resolve => img.onload = resolve);

            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (img.height * imgWidth) / img.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if content is longer
            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            pdf.save(`${athleteName.replace(/\s+/g, '-')}-profile.pdf`);
            printWindow.close();
            toast.success('PDF exported successfully!');
          } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
            printWindow.close();
          }
        }, 1000);
      });

      if (onGeneratePDF) {
        onGeneratePDF();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Profile</CardTitle>
        <CardDescription>
          Share your profile with coaches, college scouts, and other contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-muted p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-2">Your Public Profile URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background px-3 py-2 rounded break-all">
              {publicProfileUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyProfileLink}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={shareProfile} className="w-full" variant="default">
          <Share2 className="mr-2 h-4 w-4" />
          Share Profile Link
        </Button>

        <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
          <DialogTrigger asChild>
            <Button onClick={generateQRCode} className="w-full" variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile QR Code</DialogTitle>
              <DialogDescription>
                Share this QR code at events for quick profile access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-lg border-4 border-primary p-4 bg-white">
                    <img src={qrCodeUrl} alt="Profile QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Scan to view profile
                  </p>
                  <Button onClick={downloadQRCode} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={exportToPDF}
          className="w-full"
          variant="outline"
          disabled={generatingPDF}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {generatingPDF ? 'Generating PDF...' : 'Export to PDF'}
        </Button>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 mt-4">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            💡 <strong>Pro Tip:</strong> Print your QR code on business cards or scouting
            materials for easy profile sharing at camps and showcases!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};