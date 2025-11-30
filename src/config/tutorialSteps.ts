export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  videoId?: string;
}

// Role-specific tutorial steps
export const parentTutorialSteps: TutorialStep[] = [
  {
    id: 'parent-welcome',
    title: 'Welcome to Your Parent Dashboard!',
    description: 'As a parent, you can monitor and support your athlete\'s recruiting journey. Let\'s show you around.',
    videoId: 'parent-intro'
  },
  {
    id: 'parent-link-athlete',
    title: 'Link Your Athlete',
    description: 'Connect your athlete\'s account to view their profile, stats, and recruiting progress. Click "Link Athlete" to get started.',
    videoId: 'parent-linking'
  },
  {
    id: 'parent-view-dashboard',
    title: 'View Athlete Dashboard',
    description: 'Once linked, you can view your athlete\'s full dashboard, including college matches, offers, and profile completion.',
    videoId: 'parent-viewing'
  },
  {
    id: 'parent-support',
    title: 'Support Your Athlete',
    description: 'Stay informed with notifications about profile updates, college interest, and important milestones in their recruiting journey.',
    videoId: 'parent-support'
  }
];

export const coachTutorialSteps: TutorialStep[] = [
  {
    id: 'coach-welcome',
    title: 'Welcome to Your Coach Dashboard!',
    description: 'As a coach, you\'ll evaluate athletes and provide professional feedback. Let\'s get you started.',
    videoId: 'coach-intro'
  },
  {
    id: 'coach-evaluations',
    title: 'Your Evaluations',
    description: 'View all assigned evaluations here. You\'ll see pending requests, in-progress evaluations, and completed assessments.',
    videoId: 'coach-evaluations'
  },
  {
    id: 'coach-available',
    title: 'Available Evaluations',
    description: 'Browse and claim new evaluation requests from athletes. Select evaluations that match your expertise.',
    videoId: 'coach-available'
  },
  {
    id: 'coach-complete',
    title: 'Complete Evaluations',
    description: 'Provide detailed feedback including technical skills, athleticism, and recommendations for improvement. Your insights help athletes grow.',
    videoId: 'coach-feedback'
  },
  {
    id: 'coach-profile',
    title: 'Your Coach Profile',
    description: 'Keep your profile updated with your expertise, experience, and availability to receive relevant evaluation requests.',
    videoId: 'coach-profile'
  }
];

export const recruiterTutorialSteps: TutorialStep[] = [
  {
    id: 'recruiter-welcome',
    title: 'Welcome College Scout!',
    description: 'Your dashboard is your command center for discovering talented athletes. Let\'s explore the key features.',
    videoId: 'recruiter-intro'
  },
  {
    id: 'recruiter-search',
    title: 'Search for Athletes',
    description: 'Use advanced filters to find prospects by sport, position, graduation year, location, GPA, and test scores. Find your perfect fit.',
    videoId: 'recruiter-search'
  },
  {
    id: 'recruiter-saved-searches',
    title: 'Save Your Searches',
    description: 'Create and save custom searches to quickly access prospects that match your program\'s needs. Get notified of new matches.',
    videoId: 'recruiter-saved'
  },
  {
    id: 'recruiter-analytics',
    title: 'Recruiting Analytics',
    description: 'Track your recruiting activity including profile views, contact requests, and engagement metrics to optimize your strategy.',
    videoId: 'recruiter-analytics'
  },
  {
    id: 'recruiter-profile-access',
    title: 'View Athlete Profiles',
    description: 'Access detailed athlete profiles including stats, highlights, academic records, and verified coach evaluations.',
    videoId: 'recruiter-profiles'
  }
];

export const onboardingTutorialSteps: Record<number, TutorialStep[]> = {
  1: [
    {
      id: 'welcome',
      title: 'Welcome to ForSwags!',
      description: 'Let\'s get your profile set up in just a few steps. Choose your role to get started.',
      targetElement: '[data-tutorial="role-selection"]',
      position: 'bottom',
      videoId: 'intro-video'
    }
  ],
  2: [
    {
      id: 'basic-info',
      title: 'Your Basic Information',
      description: 'This information helps colleges and college scouts find and contact you.',
      targetElement: '[data-tutorial="basic-info-form"]',
      position: 'right',
      videoId: 'profile-basics'
    }
  ],
  3: [
    {
      id: 'sport-details',
      title: 'Sport & Position',
      description: 'Select your primary sport and position. This helps match you with the right opportunities.',
      targetElement: '[data-tutorial="sport-selection"]',
      position: 'right',
      videoId: 'sport-profile'
    }
  ],
  4: [
    {
      id: 'measurements',
      title: 'Physical Stats',
      description: 'Accurate measurements help college scouts assess your fit for their programs.',
      targetElement: '[data-tutorial="measurements-form"]',
      position: 'right',
      videoId: 'physical-stats'
    }
  ],
  5: [
    {
      id: 'academics',
      title: 'Academic Information',
      description: 'Your academic achievements are just as important as your athletic performance.',
      targetElement: '[data-tutorial="academics-form"]',
      position: 'right',
      videoId: 'academics-guide'
    }
  ],
  6: [
    {
      id: 'final-touches',
      title: 'Final Touches',
      description: 'Add highlights and complete your profile to stand out to college scouts.',
      targetElement: '[data-tutorial="highlights-form"]',
      position: 'right',
      videoId: 'profile-completion'
    }
  ]
};

export const videoLibrary: Record<string, { title: string; url: string; duration: string; thumbnail: string }> = {
  'intro-video': {
    title: 'Getting Started with ForSwags',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:30',
    thumbnail: '/placeholder.svg'
  },
  'profile-basics': {
    title: 'Creating Your Profile',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:15',
    thumbnail: '/placeholder.svg'
  },
  'sport-profile': {
    title: 'Athlete Profile Best Practices',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '4:00',
    thumbnail: '/placeholder.svg'
  },
  'physical-stats': {
    title: 'Recording Accurate Measurements',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:45',
    thumbnail: '/placeholder.svg'
  },
  'academics-guide': {
    title: 'Academic Requirements Guide',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '5:20',
    thumbnail: '/placeholder.svg'
  },
  'profile-completion': {
    title: 'Completing Your Profile',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:30',
    thumbnail: '/placeholder.svg'
  },
  'parent-intro': {
    title: 'Parent Dashboard Overview',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:45',
    thumbnail: '/placeholder.svg'
  },
  'parent-linking': {
    title: 'Linking Your Athlete',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:00',
    thumbnail: '/placeholder.svg'
  },
  'parent-viewing': {
    title: 'Viewing Athlete Progress',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:30',
    thumbnail: '/placeholder.svg'
  },
  'parent-support': {
    title: 'Supporting Your Athlete',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:15',
    thumbnail: '/placeholder.svg'
  },
  'coach-intro': {
    title: 'Coach Dashboard Guide',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:00',
    thumbnail: '/placeholder.svg'
  },
  'coach-evaluations': {
    title: 'Managing Evaluations',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '4:15',
    thumbnail: '/placeholder.svg'
  },
  'coach-available': {
    title: 'Claiming Evaluation Requests',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:50',
    thumbnail: '/placeholder.svg'
  },
  'coach-feedback': {
    title: 'Providing Quality Feedback',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '5:30',
    thumbnail: '/placeholder.svg'
  },
  'coach-profile': {
    title: 'Coach Profile Setup',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:40',
    thumbnail: '/placeholder.svg'
  },
  'recruiter-intro': {
    title: 'College Scout Dashboard',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:20',
    thumbnail: '/placeholder.svg'
  },
  'recruiter-search': {
    title: 'Advanced Athlete Search',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '4:45',
    thumbnail: '/placeholder.svg'
  },
  'recruiter-saved': {
    title: 'Saved Searches & Alerts',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:10',
    thumbnail: '/placeholder.svg'
  },
  'recruiter-analytics': {
    title: 'Recruiting Analytics Dashboard',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '4:00',
    thumbnail: '/placeholder.svg'
  },
  'recruiter-profiles': {
    title: 'Accessing Athlete Profiles',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:30',
    thumbnail: '/placeholder.svg'
  }
};
