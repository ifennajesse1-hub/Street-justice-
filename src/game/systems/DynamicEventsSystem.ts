import { DynamicEvent } from '../../types/game';

export const DYNAMIC_EVENT_TEMPLATES: Omit<DynamicEvent, 'id' | 'active' | 'timeRemaining'>[] = [
  {
    title: '10-31: Armed Robbery at Metro Gas & Mart',
    type: 'robbery',
    description: 'Panic alarm triggered at the gas station convenience store. Suspect armed with sidearm.',
    locationName: 'Downtown Gas Station',
    position: { x: -15, y: 0, z: -55 },
    rewardMoney: 350,
    rewardXP: 250,
  },
  {
    title: '10-25: Stolen Sports Car Sighted',
    type: 'car_theft',
    description: 'Hotwired muscle car fleeing eastbound down Main Avenue. Execute traffic stop.',
    locationName: 'Main Avenue Intersection',
    position: { x: 10, y: 0, z: -10 },
    rewardMoney: 400,
    rewardXP: 300,
  },
  {
    title: '10-15: Street Brawl Outside Nightclub',
    type: 'brawl',
    description: 'Multiple intoxicated syndicate patrons brawling on the sidewalk. Order suspects to disperse or cuff them.',
    locationName: 'Commercial Syndicate Plaza',
    position: { x: -35, y: 0, z: -10 },
    rewardMoney: 250,
    rewardXP: 200,
  },
  {
    title: '10-33: Officer Calling for Immediate Assistance',
    type: 'pursuit',
    description: 'Patrol unit under fire from fleeing suspects near the docks. Provide immediate tactical backup.',
    locationName: 'Harbor Shipping Pier',
    position: { x: 35, y: 0, z: 30 },
    rewardMoney: 550,
    rewardXP: 400,
  },
  {
    title: '10-54: Civilian Mugging in Back Alley',
    type: 'hostage',
    description: 'Distress call from pedestrian cornered by two armed thugs demanding wallet and keys.',
    locationName: 'Residential Alleyway',
    position: { x: -40, y: 0, z: 15 },
    rewardMoney: 300,
    rewardXP: 280,
  },
];

export function generateRandomCityEvent(): DynamicEvent {
  const template = DYNAMIC_EVENT_TEMPLATES[Math.floor(Math.random() * DYNAMIC_EVENT_TEMPLATES.length)];
  return {
    ...template,
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    active: true,
    timeRemaining: 180, // 3 minutes to respond
  };
}
