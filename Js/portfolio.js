// UI logic: menu toggle, nav scrolling, modal, theme toggle, set year

document.addEventListener('DOMContentLoaded', () => {
	// Menu toggle
	const menuToggle = document.getElementById('menuToggle');
	const nav = document.getElementById('nav-links');
	if(menuToggle && nav){
		menuToggle.addEventListener('click', () => {
			const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
			menuToggle.setAttribute('aria-expanded', String(!expanded));
			nav.classList.toggle('show');
		});
	}

	// Smooth scrolling and active link highlight
	document.querySelectorAll('.nav-link').forEach(link=>{
		link.addEventListener('click', (e)=>{
			e.preventDefault();
			const id = link.getAttribute('href').slice(1);
			const target = document.getElementById(id);
			if(target){
				target.scrollIntoView({behavior:'smooth',block:'start'});
			}
			document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
			link.classList.add('active');
			// close mobile menu
			if(nav && nav.classList.contains('show')){ nav.classList.remove('show'); menuToggle.setAttribute('aria-expanded','false') }
		});
	});

	// Set year
	const yearEl = document.getElementById('year');
	if(yearEl) yearEl.textContent = new Date().getFullYear();

	// Help modal logic
	const helpBtn = document.getElementById('helpBtn');
	const helpModal = document.getElementById('helpModal');
	const helpClose = document.getElementById('helpClose');

	function openHelp(){
		if(!helpModal || !helpClose) return;
		helpModal.classList.remove('hidden');
		helpModal.setAttribute('aria-hidden','false');
		helpClose.focus();
		document.body.style.overflow = 'hidden';
	}
	function closeHelp(){
		if(!helpModal || !helpBtn) return;
		helpModal.classList.add('hidden');
		helpModal.setAttribute('aria-hidden','true');
		helpBtn.focus();
		document.body.style.overflow = '';
	}

	if(helpBtn && helpModal && helpClose){
		helpBtn.addEventListener('click', openHelp);
		helpClose.addEventListener('click', closeHelp);

		helpModal.addEventListener('click', (e)=>{
			if(e.target === helpModal) closeHelp();
		});

		document.addEventListener('keydown', (e)=>{
			if(e.key === 'Escape' && helpModal.getAttribute('aria-hidden') === 'false'){
				closeHelp();
			}
		});
	}

	// Theme toggle logic
	(function(){
		const themeToggle = document.getElementById('themeToggle');
		const body = document.body;
		const storageKey = 'portfolio-theme';
		if(!themeToggle) return;

		function applyTheme(isLight){
			if(isLight){
				body.classList.add('light');
				themeToggle.setAttribute('aria-pressed','true');
			} else {
				body.classList.remove('light');
				themeToggle.setAttribute('aria-pressed','false');
			}
			swapBrandLogos(isLight);
		}

		// initialize from localStorage or prefers-color-scheme
		const saved = localStorage.getItem(storageKey);
		if(saved === 'light'){
			applyTheme(true);
		} else if(saved === 'dark'){
			applyTheme(false);
		} else {
			const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
			applyTheme(prefersLight);
		}

		themeToggle.addEventListener('click', () => {
			const isLight = body.classList.toggle('light');
			themeToggle.setAttribute('aria-pressed', String(isLight));
			localStorage.setItem(storageKey, isLight ? 'light' : 'dark');
			swapBrandLogos(isLight);
		});
	})();

	initProjectGallery();
	initProjectCardObserver();
	initSectionReveal();
});

function initProjectGallery(){
	const modal = document.getElementById('projectModal');
	const cards = document.querySelectorAll('.project-card');
	if(!modal || !cards.length) return;

	const titleEl = modal.querySelector('#projectModalTitle');
	const descEl = modal.querySelector('#projectModalDescription');
	const imageEl = modal.querySelector('#projectCarouselImage');
	const dotsEl = modal.querySelector('#projectCarouselDots');
	const closeBtn = modal.querySelector('[data-project-modal-close]');
	const prevBtn = modal.querySelector('[data-carousel-prev]');
	const nextBtn = modal.querySelector('[data-carousel-next]');

	let images = [];
	let currentIndex = 0;

	const closeModal = ()=>{
		modal.classList.add('hidden');
		modal.setAttribute('aria-hidden','true');
		document.body.style.overflow = '';
	};

	const updateCarousel = ()=>{
		if(!images.length){
			imageEl.src = '';
			dotsEl.innerHTML = '';
			return;
		}
		imageEl.src = images[currentIndex];
		imageEl.alt = `${titleEl.textContent} screenshot ${currentIndex + 1}`;

		dotsEl.innerHTML = '';
		images.forEach((_, idx)=>{
			const dot = document.createElement('button');
			dot.type = 'button';
			dot.className = `carousel-dot${idx === currentIndex ? ' active' : ''}`;
			dot.setAttribute('aria-label', `Show screenshot ${idx + 1}`);
			dot.addEventListener('click', ()=>{
				currentIndex = idx;
				updateCarousel();
			});
			dotsEl.appendChild(dot);
		});
	};

	const openModal = (card)=>{
		const galleryImages = (card.dataset.images || '').split('|').filter(Boolean);
		if(!galleryImages.length) return;

		images = galleryImages;
		currentIndex = 0;

		titleEl.textContent = card.querySelector('h3')?.textContent?.trim() || 'Project';
		const desc = card.dataset.description || card.querySelector('.project-card__summary')?.textContent || '';
		descEl.textContent = desc;

		updateCarousel();

		modal.classList.remove('hidden');
		modal.setAttribute('aria-hidden','false');
		document.body.style.overflow = 'hidden';
	};

	cards.forEach(card=>{
		card.querySelectorAll('.project-gallery-btn').forEach(btn=>{
			btn.addEventListener('click', ()=>openModal(card));
		});
	});

	closeBtn?.addEventListener('click', closeModal);
	modal.addEventListener('click', (event)=>{
		if(event.target === modal) closeModal();
	});
	document.addEventListener('keydown', (event)=>{
		if(event.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false'){
			closeModal();
		}
	});

	prevBtn?.addEventListener('click', ()=>{
		if(!images.length) return;
		currentIndex = (currentIndex - 1 + images.length) % images.length;
		updateCarousel();
	});
	nextBtn?.addEventListener('click', ()=>{
		if(!images.length) return;
		currentIndex = (currentIndex + 1) % images.length;
		updateCarousel();
	});
}

function initProjectCardObserver(){
	const cards = document.querySelectorAll('.project-card');
	if(!cards.length) return;
	if(!('IntersectionObserver' in window)){
		cards.forEach(card=>card.classList.add('project-card--visible'));
		return;
	}

	const observer = new IntersectionObserver((entries)=>{
		entries.forEach(entry=>{
			if(entry.isIntersecting){
				entry.target.classList.add('project-card--visible');
				observer.unobserve(entry.target);
			}
		});
	},{ threshold:0.25 });

	cards.forEach(card=>observer.observe(card));
}

function initSectionReveal(){
	const sections = document.querySelectorAll('.section');
	if(!sections.length) return;
	if(!('IntersectionObserver' in window)){
		sections.forEach(section=>section.classList.add('section--revealed'));
		return;
	}

	const observer = new IntersectionObserver((entries)=>{
		entries.forEach(entry=>{
			if(entry.isIntersecting){
				entry.target.classList.add('section--revealed');
				observer.unobserve(entry.target);
			}
		});
	},{ threshold:0.2 });

	sections.forEach(section=>observer.observe(section));
}

function swapBrandLogos(isLight){
	const logos = document.querySelectorAll('[data-brand-logo],[data-footer-logo]');
	if(!logos.length) return;
	const src = isLight ? 'Style/assets/light_logo.png' : 'Style/assets/dark_logo.png';
	const alt = isLight ? 'Ric Villanueva logo (light)' : 'Ric Villanueva logo (dark)';
	logos.forEach(img=>{
		img.setAttribute('src', src);
		img.setAttribute('alt', alt);
	});
}
