export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 fade-in">
      <img
        src="/ssb-logo.png"
        alt="Summer"
        className="w-8 h-8 rounded-full object-contain bg-white border-2 border-ssb-blue p-1"
      />
      <div className="bg-ssb-blue text-white px-4 py-3 rounded-2xl rounded-tl-sm max-w-xs">
        <div className="flex items-center gap-1">
          <span className="text-sm">Summer is typing</span>
          <div className="flex gap-1 ml-2">
            <div className="w-2 h-2 bg-white rounded-full dot-1"></div>
            <div className="w-2 h-2 bg-white rounded-full dot-2"></div>
            <div className="w-2 h-2 bg-white rounded-full dot-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
