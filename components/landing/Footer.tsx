export function Footer() {
  return (
    <footer className="relative px-6 md:px-10 pt-16 pb-12 bg-[#242220] text-[#FAF9F5] border-t border-[rgba(255,255,253,0.06)]">
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #242220)", transform: "translateY(-100%)" }}
      />
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <span className="text-[28px] font-bold tracking-tight text-[#FAF9F5] block mb-3 font-serif">ClearRail</span>
            <p className="text-body-sm text-[var(--color-text-inverse-secondary)] max-w-sm leading-relaxed">
              Decentralized, AI-powered worker safety identity anchored on Arbitrum Sepolia. Portable compliance for modern enterprise workforces.
            </p>
          </div>
          <div>
            <p className="text-mono-sm text-[#A3A19C] font-semibold tracking-wider mb-3">Platform</p>
            <div className="flex flex-col gap-2.5">
              <a href="https://github.com/0xkinno/cairn" target="_blank" rel="noopener noreferrer" className="text-body-sm text-[var(--color-text-inverse-secondary)] transition-colors duration-200 hover:text-[var(--color-accent)]">
                GitHub Repository
              </a>
              <a
                href="https://testnet.nearblocks.io/address/cairn-deployer.testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-[var(--color-text-inverse-secondary)] transition-colors duration-200 hover:text-[var(--color-accent)]"
              >
                Arbitrum Sepolia Testnet Contract
              </a>
            </div>
          </div>
          <div>
            <p className="text-mono-sm text-[#A3A19C] font-semibold tracking-wider mb-3">Resources</p>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-body-sm text-[var(--color-text-inverse-secondary)] transition-colors duration-200 hover:text-[var(--color-accent)]">
                Demo Video
              </a>
              <a href="#" className="text-body-sm text-[var(--color-text-inverse-secondary)] transition-colors duration-200 hover:text-[var(--color-accent)]">
                Platform Documentation
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-mono-sm text-[#A3A19C] text-[10px]">&copy; {new Date().getFullYear()} ClearRail. All rights reserved.</p>
          <p className="text-mono-sm text-[#A3A19C] text-[10px]">Anchored securely on Arbitrum Sepolia</p>
        </div>
      </div>
    </footer>
  );
}
