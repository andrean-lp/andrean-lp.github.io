import rawProfile from './profile.json';

export interface ProfileData {
	name?: string;
	headline?: string;
	role?: string;
	bio?: string;
	avatar?: string;
	twitter?: string;
	website?: string;
	github?: string;
	youtube?: string;
	instagram?: string;
	facebook?: string;
	linkedin?: string;
	pinterest?: string;
	[key: string]: any;
}

export const profile: ProfileData = rawProfile as ProfileData;
export default profile;
