import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
    onValidate: (isValid: boolean) => void;
}

export const Captcha = ({ onValidate }: CaptchaProps) => {
    const [captchaCode, setCaptchaCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generateCaptcha = useCallback(() => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setCaptchaCode(code);
        setInputCode('');
        onValidate(false);
        return code;
    }, [onValidate]);

    const drawCaptcha = useCallback((code: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise (lines)
        for (let i = 0; i < 7; i++) {
            ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Add noise (dots)
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw text
        ctx.font = 'bold 24px monospace';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < code.length; i++) {
            ctx.save();
            ctx.translate(20 + i * 25, canvas.height / 2);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`;
            ctx.fillText(code[i], 0, 0);
            ctx.restore();
        }
    }, []);

    useEffect(() => {
        const code = generateCaptcha();
        drawCaptcha(code);
    }, [generateCaptcha, drawCaptcha]);

    const handleRefresh = () => {
        const code = generateCaptcha();
        drawCaptcha(code);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputCode(value);
        onValidate(value === captchaCode);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={50}
                    className="rounded-md border border-border cursor-pointer"
                    onClick={handleRefresh}
                    title="Click to refresh"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    className="shrink-0"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
            <input
                type="text"
                value={inputCode}
                onChange={handleChange}
                placeholder="Enter CAPTCHA code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    );
};
