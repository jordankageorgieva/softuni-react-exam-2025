import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// const { pathname } = useLocation();

export default {
    useScrollToTop() {
        useEffect(() => {
            window.scrollTo(0, 0);
        });
    }
} 
