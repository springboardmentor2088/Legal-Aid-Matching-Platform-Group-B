import api from './api';

const directoryService = {
    searchDirectory: async (query, state, city, type, specialization, minExp, maxExp, minRating, maxRating, languages, page = 0, size = 10) => {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (state) params.append('state', state);
        if (city) params.append('city', city);
        if (type && type !== 'all') params.append('type', type);
        if (specialization) params.append('specialization', specialization);
        if (minExp !== undefined && minExp !== null) params.append('minExp', minExp);
        if (maxExp !== undefined && maxExp !== null) params.append('maxExp', maxExp);
        if (minRating) params.append('minRating', minRating);
        if (maxRating) params.append('maxRating', maxRating);
        if (languages) params.append('languages', languages);
        params.append('page', page);
        params.append('size', size);

        return api.get(`/public/directory/search?${params.toString()}`);
    },
};

export default directoryService;
