import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Code, Mail, QrCode, Download, Send } from 'lucide-react';
import QRCode from 'qrcode';
import { Form } from '../types';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  onOpenRespondentView: () => void;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  form,
  onOpenRespondentView,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode' | 'embed' | 'email'>('link');
  const [isShortUrl, setIsShortUrl] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [embedWidth, setEmbedWidth] = useState('640');
  const [embedHeight, setEmbedHeight] = useState('800');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState(`I've invited you to fill out a form: ${form.title}`);
  const [emailMessage, setEmailMessage] = useState(`Hello,\n\nPlease take a few moments to complete this form: ${form.title}.\n\nThank you!`);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const currentUrl = window.location.href;
  const baseUrl = `${currentUrl.split('?')[0]}?respondent=${form.id}`;
  const shareableUrl = isShortUrl ? `${baseUrl}&short=1` : baseUrl;
  const embedCode = `<iframe src="${shareableUrl}" width="${embedWidth}" height="${embedHeight}" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;

  // Generate QR Code on modal open or URL change
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(shareableUrl, { margin: 2, width: 250 }, (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      });
    }
  }, [isOpen, shareableUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isEmbed = false) => {
    navigator.clipboard.writeText(text);
    if (isEmbed) {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipients.trim()) {
      alert('Please enter at least one recipient email address.');
      return;
    }
    setEmailSentSuccess(true);
    setTimeout(() => {
      setEmailSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1">Send form</h3>
        <p className="text-xs text-gray-500 mb-5 truncate font-medium">{form.title}</p>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'link'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Link</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'qrcode'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('embed')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'embed'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>HTML Embed</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'email'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
        </div>

        {/* LINK TAB */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Shareable Respondent Link
            </p>

            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full bg-transparent text-xs text-gray-800 focus:outline-hidden px-2 truncate font-mono"
              />
              <button
                onClick={() => copyToClipboard(shareableUrl)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShortUrl}
                  onChange={(e) => setIsShortUrl(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded-xs focus:ring-purple-500"
                />
                <span className="font-medium">Shorten URL</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenRespondentView();
                }}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Form Respondent View</span>
              </button>
            </div>
          </div>
        )}

        {/* QR CODE TAB */}
        {activeTab === 'qrcode' && (
          <div className="space-y-4 text-center">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Scan QR Code to Open Form
            </p>

            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Form QR Code"
                  className="w-48 h-48 rounded-lg shadow-xs bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
                  Generating QR Code...
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-2 font-mono truncate max-w-xs">
                {shareableUrl}
              </p>
            </div>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${form.title.toLowerCase().replace(/\s+/g, '_')}_qr.png`}
                className="w-full py-2.5 bg-purple-600 text-white font-medium text-xs rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer inline-flex"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code Image</span>
              </a>
            )}
          </div>
        )}

        {/* EMBED TAB */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Embed HTML Code
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Width (px)</label>
                <input
                  type="text"
                  value={embedWidth}
                  onChange={(e) => setEmbedWidth(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Height (px)</label>
                <input
                  type="text"
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <textarea
              readOnly
              rows={4}
              value={embedCode}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-700 focus:outline-hidden resize-none"
            />

            <button
              onClick={() => copyToClipboard(embedCode, true)}
              className="w-full py-2.5 bg-purple-600 text-white font-medium text-xs rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              {copiedEmbed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmbed ? 'Embed Code Copied!' : 'Copy Embed Code'}</span>
            </button>
          </div>
        )}

        {/* EMAIL INVITE TAB */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
            {emailSentSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Email Invitations Dispatched!</h4>
                <p className="text-xs text-emerald-700">
                  Form link invitations have been sent to recipients.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">To (Email Addresses)</label>
                  <input
                    type="text"
                    required
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="alice@example.com, bob@example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-200 focus:outline-hidden resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 text-white font-medium text-xs rounded-xl hover:bg-purple-700 transition-colors mt-2 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invitations</span>
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
