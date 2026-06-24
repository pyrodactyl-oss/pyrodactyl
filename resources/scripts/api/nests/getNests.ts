import http from '@/api/http';

interface Egg {
    attributes: {
        id: number;
        uuid: string;
        name: string;
        description: string;
    };
    object: string;
}

interface Nest {
    attributes: {
        id: number;
        uuid: string;
        author: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
    object: string;
}

export default (): Promise<Nest[]> =>
    new Promise((resolve, reject) => {
        http.get('/api/client/nests')
            .then(({ data }) => resolve(data.data))
            .catch(reject);
    });
