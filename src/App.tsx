/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { evaluate } from 'mathjs';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings2, 
  RotateCcw, 
  Delete, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Info,
  History,
  ArrowRightLeft,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Scale,
  Thermometer,
  Ruler,
  Clock,
  Zap,
  Wind,
  Layers,
  Sparkles
} from 'lucide-react';
import { AlgebrAI } from './components/AlgebrAI';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Analytics } from '@vercel/analytics/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Mode = 'basic' | 'scientific' | 'conversion' | 'ai';
type Theme = 'light' | 'dark';
type Layout = 'mobile' | 'desktop';

interface CalculatorButtonProps {
  label: string | React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'operator' | 'function' | 'action' | 'equal';
  theme?: Theme;
  layout?: Layout;
  key?: React.Key;
}

const CalculatorButton = ({ label, onClick, className, variant = 'default', theme = 'dark', layout = 'mobile' }: CalculatorButtonProps) => {
  const isDark = theme === 'dark';
  
  const variants = {
    default: isDark 
      ? 'bg-zinc-800/40 hover:bg-zinc-700/60 text-zinc-100 border-zinc-700/30' 
      : 'bg-white/80 hover:bg-white text-zinc-900 border-zinc-200/50 shadow-sm',
    operator: isDark
      ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-semibold border-orange-500/20'
      : 'bg-orange-50/80 hover:bg-orange-100 text-orange-600 font-semibold border-orange-200/50 shadow-sm',
    function: isDark
      ? 'bg-zinc-700/20 hover:bg-zinc-600/40 text-zinc-300 text-sm border-zinc-600/20'
      : 'bg-zinc-50/80 hover:bg-zinc-100 text-zinc-600 text-sm border-zinc-200/50 shadow-sm',
    action: isDark
      ? 'bg-zinc-700/40 hover:bg-zinc-600/60 text-zinc-400 border-zinc-600/30'
      : 'bg-zinc-100/80 hover:bg-zinc-200 text-zinc-500 border-zinc-200/50 shadow-sm',
    equal: 'bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/30 border-orange-400/20',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92, rotate: -1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl flex items-center justify-center transition-all duration-300 select-none border backdrop-blur-md',
        layout === 'mobile' ? 'h-16 text-xl' : 'h-12 text-sm',
        variants[variant],
        className
      )}
    >
      {label}
    </motion.button>
  );
};

export default function App() {
  const [mode, setMode] = useState<Mode>('basic');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [unitValue, setUnitValue] = useState('');
  const [unitFrom, setUnitFrom] = useState('degC');
  const [unitTo, setUnitTo] = useState('degF');
  const [unitResult, setUnitResult] = useState<string | null>(null);
  const [unitCategory, setUnitCategory] = useState('Temperature');
  const [theme, setTheme] = useState<Theme>('dark');
  const [layout, setLayout] = useState<Layout>('mobile');
  const [showSettings, setShowSettings] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [expression]);

  const handleInput = (val: string) => {
    if (result && !['+', '-', '*', '/', '×', '÷', '^', '%'].includes(val)) {
      setExpression(val);
      setResult(null);
    } else if (result) {
      setExpression(result + val);
      setResult(null);
    } else {
      setExpression(prev => prev + val);
    }
  };

  const handleClear = () => {
    setExpression('');
    setResult(null);
  };

  const handleBackspace = () => {
    if (result) {
      setResult(null);
    } else {
      setExpression(prev => prev.slice(0, -1));
    }
  };

  const calculate = () => {
    if (!expression) return;
    try {
      // Replace visual symbols with mathjs compatible ones
      let sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/e/g, 'e')
        .replace(/log\(/g, 'log10(')
        .replace(/ln\(/g, 'log(')
        .replace(/√\(/g, 'sqrt(');

      const evalResult = evaluate(sanitized);
      const formattedResult = typeof evalResult === 'number'
        ? (Number.isInteger(evalResult) 
            ? evalResult.toString() 
            : parseFloat(evalResult.toFixed(8)).toString())
        : evalResult.toString();
      
      setResult(formattedResult);
      setHistory(prev => [expression + ' = ' + formattedResult, ...prev].slice(0, 10));
    } catch (error) {
      setResult('Error');
    }
  };

  const handleUnitConvert = () => {
    if (!unitValue) return;
    try {
      const res = evaluate(`${unitValue} ${unitFrom} to ${unitTo}`);
      const numericValue = typeof res === 'number' ? res : res.toNumber(unitTo);
      setUnitResult(numericValue.toLocaleString(undefined, { 
        maximumFractionDigits: 6,
        useGrouping: true 
      }));
    } catch (error) {
      setUnitResult('Error');
    }
  };

  const unitCategories = [
    { 
      name: 'Temperature', 
      icon: <Thermometer size={18} />,
      units: [
        { label: 'Celsius', value: 'degC', symbol: '°C' },
        { label: 'Fahrenheit', value: 'degF', symbol: '°F' },
        { label: 'Kelvin', value: 'K', symbol: 'K' }
      ] 
    },
    { 
      name: 'Length', 
      icon: <Ruler size={18} />,
      units: [
        { label: 'Kilometers', value: 'km', symbol: 'km' },
        { label: 'Miles', value: 'mi', symbol: 'mi' },
        { label: 'Meters', value: 'm', symbol: 'm' },
        { label: 'Feet', value: 'ft', symbol: 'ft' },
        { label: 'Inches', value: 'in', symbol: 'in' },
        { label: 'Centimeters', value: 'cm', symbol: 'cm' },
        { label: 'Millimeters', value: 'mm', symbol: 'mm' },
        { label: 'Yards', value: 'yd', symbol: 'yd' },
        { label: 'Nautical Miles', value: 'nmi', symbol: 'nmi' }
      ] 
    },
    { 
      name: 'Weight', 
      icon: <Scale size={18} />,
      units: [
        { label: 'Kilograms', value: 'kg', symbol: 'kg' },
        { label: 'Pounds', value: 'lb', symbol: 'lb' },
        { label: 'Grams', value: 'g', symbol: 'g' },
        { label: 'Ounces', value: 'oz', symbol: 'oz' },
        { label: 'Metric Ton', value: 'tonne', symbol: 't' },
        { label: 'Milligrams', value: 'mg', symbol: 'mg' }
      ] 
    },
    { 
      name: 'Volume', 
      icon: <Layers size={18} />,
      units: [
        { label: 'Liters', value: 'l', symbol: 'L' },
        { label: 'Milliliters', value: 'ml', symbol: 'mL' },
        { label: 'Gallons', value: 'gal', symbol: 'gal' },
        { label: 'Cups', value: 'cup', symbol: 'cup' },
        { label: 'Quarts', value: 'qt', symbol: 'qt' },
        { label: 'Pints', value: 'pt', symbol: 'pt' }
      ] 
    },
    { 
      name: 'Speed', 
      icon: <Wind size={18} />,
      units: [
        { label: 'km/h', value: 'km/h', symbol: 'km/h' },
        { label: 'mph', value: 'mph', symbol: 'mph' },
        { label: 'm/s', value: 'm/s', symbol: 'm/s' },
        { label: 'Knots', value: 'knot', symbol: 'kn' }
      ] 
    },
    { 
      name: 'Time', 
      icon: <Clock size={18} />,
      units: [
        { label: 'Seconds', value: 'second', symbol: 's' },
        { label: 'Minutes', value: 'minute', symbol: 'min' },
        { label: 'Hours', value: 'hour', symbol: 'h' },
        { label: 'Days', value: 'day', symbol: 'd' },
        { label: 'Weeks', value: 'week', symbol: 'wk' },
        { label: 'Months', value: 'month', symbol: 'mo' },
        { label: 'Years', value: 'year', symbol: 'yr' }
      ] 
    }
  ];

  const basicButtons: CalculatorButtonProps[] = [
    { label: 'AC', onClick: handleClear, variant: 'action' },
    { label: <Delete className="w-5 h-5" />, onClick: handleBackspace, variant: 'action' },
    { label: '%', onClick: () => handleInput('%'), variant: 'action' },
    { label: '÷', onClick: () => handleInput('÷'), variant: 'operator' },
    { label: '7', onClick: () => handleInput('7') },
    { label: '8', onClick: () => handleInput('8') },
    { label: '9', onClick: () => handleInput('9') },
    { label: '×', onClick: () => handleInput('×'), variant: 'operator' },
    { label: '4', onClick: () => handleInput('4') },
    { label: '5', onClick: () => handleInput('5') },
    { label: '6', onClick: () => handleInput('6') },
    { label: '-', onClick: () => handleInput('-'), variant: 'operator' },
    { label: '1', onClick: () => handleInput('1') },
    { label: '2', onClick: () => handleInput('2') },
    { label: '3', onClick: () => handleInput('3') },
    { label: '+', onClick: () => handleInput('+'), variant: 'operator' },
    { label: '0', onClick: () => handleInput('0'), className: 'col-span-2' },
    { label: '.', onClick: () => handleInput('.') },
    { label: '=', onClick: calculate, variant: 'equal' },
  ];

  const scientificButtons: CalculatorButtonProps[] = [
    { label: 'sin', onClick: () => handleInput('sin('), variant: 'function' },
    { label: 'cos', onClick: () => handleInput('cos('), variant: 'function' },
    { label: 'tan', onClick: () => handleInput('tan('), variant: 'function' },
    { label: 'log', onClick: () => handleInput('log('), variant: 'function' },
    { label: 'ln', onClick: () => handleInput('ln('), variant: 'function' },
    { label: '√', onClick: () => handleInput('sqrt('), variant: 'function' },
    { label: 'π', onClick: () => handleInput('π'), variant: 'function' },
    { label: 'e', onClick: () => handleInput('e'), variant: 'function' },
    { label: '^', onClick: () => handleInput('^'), variant: 'function' },
    { label: '(', onClick: () => handleInput('('), variant: 'function' },
    { label: ')', onClick: () => handleInput(')'), variant: 'function' },
    { label: '!', onClick: () => handleInput('!'), variant: 'function' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in the unit converter input
      if (mode === 'conversion' && document.activeElement?.tagName === 'INPUT') return;

      const key = e.key;

      if (/[0-9]/.test(key)) {
        handleInput(key);
      } else if (key === '.') {
        handleInput('.');
      } else if (key === '+') {
        handleInput('+');
      } else if (key === '-') {
        handleInput('-');
      } else if (key === '*') {
        handleInput('×');
      } else if (key === '/') {
        e.preventDefault();
        handleInput('÷');
      } else if (key === '%') {
        handleInput('%');
      } else if (key === '(') {
        handleInput('(');
      } else if (key === ')') {
        handleInput(')');
      } else if (key === '^') {
        handleInput('^');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape' || key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, result, mode]);

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-700 ease-in-out",
      isDark ? "bg-[#050505] text-zinc-100 selection:bg-orange-500/30" : "bg-zinc-50 text-zinc-900 selection:bg-orange-500/20"
    )}>
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-1000",
          isDark ? "bg-orange-500/10" : "bg-orange-500/5"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-1000",
          isDark ? "bg-blue-500/10" : "bg-blue-500/5"
        )} />
      </div>

      <div 
        className={cn(
          "w-full transition-all duration-500 ease-in-out rounded-[3rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border relative overflow-hidden backdrop-blur-2xl",
          layout === 'mobile' ? "max-w-md" : "max-w-3xl",
          isDark ? "bg-[#121214]/90 border-zinc-800/50" : "bg-white/90 border-zinc-200/80"
        )}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl backdrop-blur-md border transition-all duration-300 font-semibold text-sm",
                isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-100 hover:bg-zinc-800" : "bg-zinc-100/80 border-zinc-200/50 text-zinc-900 hover:bg-white shadow-sm"
              )}
            >
              <span className="capitalize">{mode}</span>
              <ChevronDown size={16} className={cn("transition-transform duration-300", showModeDropdown && "rotate-180")} />
            </motion.button>

            <AnimatePresence>
              {showModeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute top-full left-0 mt-2 w-48 rounded-2xl border p-1.5 z-50 backdrop-blur-xl shadow-2xl",
                    isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-white/90 border-zinc-200"
                  )}
                >
                  {(['basic', 'scientific', 'conversion', 'ai'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setShowModeDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize flex items-center justify-between",
                        mode === m 
                          ? (isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-900")
                          : (isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50")
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {m === 'ai' && <Sparkles size={14} className="text-orange-500" />}
                        {m === 'ai' ? 'AlgebrAI' : m}
                      </div>
                      {mode === m && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 border",
                isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:text-zinc-100" : "bg-zinc-100/80 border-zinc-200/50 text-zinc-500 hover:text-zinc-900"
              )}
            >
              <History size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 border",
                isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:text-zinc-100" : "bg-zinc-100/80 border-zinc-200/50 text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Settings2 size={20} />
            </motion.button>
          </div>
        </div>

        {/* Display Area */}
        {mode === 'ai' ? (
          <div className="mb-10 px-4">
            <AlgebrAI theme={theme} />
          </div>
        ) : mode !== 'conversion' ? (
          <div className="mb-10 px-4">
            <div 
              ref={displayRef}
              className={cn(
                "h-14 text-right text-2xl overflow-x-auto whitespace-nowrap scrollbar-hide mb-2 font-mono tracking-tight transition-colors duration-500",
                isDark ? "text-zinc-500" : "text-zinc-400"
              )}
            >
              {expression || '0'}
            </div>
            <div className="h-24 flex items-end justify-end overflow-hidden">
              <div
                className={cn(
                  "text-right font-bold tracking-tighter break-all transition-all duration-500",
                  result === 'Error' ? "text-red-400 text-4xl" : (isDark ? "text-white text-6xl" : "text-zinc-900 text-6xl")
                )}
              >
                {result ? (result.length > 12 ? result.slice(0, 12) + '...' : result) : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-10 px-4">
            <div className={cn(
              "text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2",
              isDark ? "text-zinc-600" : "text-zinc-400"
            )}>
              <ArrowRightLeft size={12} /> Unit Conversion Engine
            </div>

            {/* Category Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {unitCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setUnitCategory(cat.name);
                    setUnitFrom(cat.units[0].value);
                    setUnitTo(cat.units[1]?.value || cat.units[0].value);
                    setUnitResult(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border",
                    unitCategory === cat.name
                      ? (isDark ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20" : "bg-orange-500 text-white border-orange-400 shadow-md")
                      : (isDark ? "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300" : "bg-zinc-100/80 border-zinc-200 text-zinc-500 hover:text-zinc-900")
                  )}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <div className="space-y-2">
                  <label className={cn("text-[10px] uppercase tracking-wider font-bold", isDark ? "text-zinc-500" : "text-zinc-400")}>From</label>
                  <div className="relative">
                    <select 
                      value={unitFrom}
                      onChange={(e) => setUnitFrom(e.target.value)}
                      className={cn(
                        "w-full border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer font-medium",
                        isDark ? "bg-zinc-800/50 border-zinc-700 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                      )}
                    >
                      {unitCategories.find(c => c.name === unitCategory)?.units.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                  </div>
                </div>

                <div className="flex items-end justify-center pb-1">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const temp = unitFrom;
                      setUnitFrom(unitTo);
                      setUnitTo(temp);
                      setUnitResult(null);
                    }}
                    className={cn(
                      "p-3 rounded-full border transition-all shadow-sm",
                      isDark ? "bg-zinc-800 border-zinc-700 text-orange-500" : "bg-white border-zinc-200 text-orange-600"
                    )}
                  >
                    <ArrowRightLeft size={16} />
                  </motion.button>
                </div>

                <div className="space-y-2">
                  <label className={cn("text-[10px] uppercase tracking-wider font-bold", isDark ? "text-zinc-500" : "text-zinc-400")}>To</label>
                  <div className="relative">
                    <select 
                      value={unitTo}
                      onChange={(e) => setUnitTo(e.target.value)}
                      className={cn(
                        "w-full border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer font-medium",
                        isDark ? "bg-zinc-800/50 border-zinc-700 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                      )}
                    >
                      {unitCategories.find(c => c.name === unitCategory)?.units.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn("text-[10px] uppercase tracking-wider font-bold", isDark ? "text-zinc-500" : "text-zinc-400")}>Input Value</label>
                <div className="relative group">
                  <input 
                    type="number"
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                    placeholder="0.00"
                    className={cn(
                      "w-full border rounded-2xl px-5 py-5 text-3xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all",
                      isDark ? "bg-zinc-800/30 border-zinc-700 text-zinc-100 placeholder:text-zinc-700" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-300"
                    )}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500/50 uppercase tracking-widest">
                    {unitCategories.flatMap(c => c.units).find(u => u.value === unitFrom)?.symbol || unitFrom}
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnitConvert}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 text-lg"
              >
                <ArrowRightLeft size={20} />
                Calculate Conversion
              </motion.button>

              <AnimatePresence>
                {unitResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={cn(
                      "p-8 rounded-[2.5rem] border relative overflow-hidden",
                      isDark ? "bg-zinc-900/60 border-zinc-800/50" : "bg-zinc-50/80 border-zinc-200 shadow-inner"
                    )}
                  >
                    <div className={cn("text-[10px] uppercase tracking-[0.3em] font-bold mb-3", isDark ? "text-zinc-600" : "text-zinc-400")}>Conversion Result</div>
                    <div className={cn("text-5xl font-bold tracking-tighter break-all", isDark ? "text-white" : "text-zinc-900")}>
                      {unitResult} <span className="text-2xl opacity-50">{unitCategories.flatMap(c => c.units).find(u => u.value === unitTo)?.symbol || unitTo}</span>
                    </div>
                    <div className={cn("text-sm font-semibold mt-2 flex items-center gap-2", isDark ? "text-orange-500/80" : "text-orange-600/80")}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      {unitCategories.flatMap(c => c.units).find(u => u.value === unitTo)?.label}
                    </div>
                    {/* Decorative background for result */}
                    <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
                      {(() => {
                        const cat = unitCategories.find(c => c.name === unitCategory);
                        if (cat?.icon && React.isValidElement(cat.icon)) {
                          return React.cloneElement(cat.icon as React.ReactElement<any>, { size: 120 });
                        }
                        return null;
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className={cn(
                "absolute inset-x-0 bottom-0 top-24 z-20 p-6 border-t",
                isDark ? "bg-[#151619] border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={cn("font-medium flex items-center gap-2", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  <History size={16} /> History
                </h3>
                <button 
                  onClick={() => setHistory([])}
                  className={cn("text-xs flex items-center gap-1", isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")}
                >
                  <RotateCcw size={12} /> Clear
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[calc(100%-2rem)] pr-2">
                {history.length === 0 ? (
                  <div className={cn("text-sm italic py-8 text-center", isDark ? "text-zinc-600" : "text-zinc-400")}>No history yet</div>
                ) : (
                  history.map((item, i) => (
                    <div key={i} className={cn("text-right border-b pb-2", isDark ? "border-zinc-800/50" : "border-zinc-100")}>
                      <div className={cn("text-sm mb-1", isDark ? "text-zinc-500" : "text-zinc-400")}>{item.split('=')[0]}</div>
                      <div className={cn("font-medium", isDark ? "text-zinc-200" : "text-zinc-800")}>{item.split('=')[1]}</div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className={cn("absolute top-4 right-6", isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")}
              >
                <ChevronLeft size={24} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className={cn(
                "absolute inset-x-0 bottom-0 top-24 z-40 p-6 border-t",
                isDark ? "bg-[#151619] border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={cn("font-medium flex items-center gap-2", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  <Settings2 size={16} /> Settings
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className={cn(isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")}
                >
                  <ChevronLeft size={24} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Theme Toggle */}
                <div className="space-y-3">
                  <label className={cn("text-[10px] uppercase tracking-wider font-semibold", isDark ? "text-zinc-500" : "text-zinc-400")}>Appearance</label>
                  <div className={cn("flex p-1 rounded-2xl", isDark ? "bg-zinc-800/50" : "bg-zinc-100")}>
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                        theme === 'light' ? "bg-white text-zinc-900 shadow-md" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <Sun size={16} /> Light
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                        theme === 'dark' ? "bg-zinc-700 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <Moon size={16} /> Dark
                    </button>
                  </div>
                </div>

                {/* Layout Toggle */}
                <div className="space-y-3">
                  <label className={cn("text-[10px] uppercase tracking-wider font-semibold", isDark ? "text-zinc-500" : "text-zinc-400")}>Layout Mode</label>
                  <div className={cn("flex p-1 rounded-2xl", isDark ? "bg-zinc-800/50" : "bg-zinc-100")}>
                    <button 
                      onClick={() => setLayout('mobile')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                        layout === 'mobile' 
                          ? (isDark ? "bg-zinc-700 text-white shadow-md" : "bg-white text-zinc-900 shadow-md") 
                          : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <Smartphone size={16} /> Mobile
                    </button>
                    <button 
                      onClick={() => setLayout('desktop')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                        layout === 'desktop' 
                          ? (isDark ? "bg-zinc-700 text-white shadow-md" : "bg-white text-zinc-900 shadow-md") 
                          : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <Monitor size={16} /> Desktop
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-4 text-center">
                <div className="space-y-1">
                  <p className={cn("text-[10px] uppercase tracking-widest font-bold", isDark ? "text-zinc-600" : "text-zinc-400")}>
                    Made by
                  </p>
                  <p className={cn("text-sm font-bold tracking-tight", isDark ? "text-zinc-200" : "text-zinc-800")}>
                    Armaan Garg
                  </p>
                  <p className={cn("text-[10px] italic", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    S/o Papa and Mumma
                  </p>
                  <p className={cn("text-[10px] italic", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    B/o Didi
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/20 space-y-1">
                  <p className={cn("text-[10px] uppercase tracking-widest font-bold", isDark ? "text-zinc-600" : "text-zinc-400")}>
                    With help from
                  </p>
                  <p className={cn("text-xs font-medium", isDark ? "text-orange-500/80" : "text-orange-600/80")}>
                    Gemini 3 Flash
                  </p>
                </div>

                <p className={cn("text-[10px] uppercase tracking-[0.3em] pt-8 opacity-30", isDark ? "text-zinc-700" : "text-zinc-300")}>
                  AlgCalc v2.5.0
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons Grid */}
        {mode !== 'conversion' && mode !== 'ai' && (
          <div className={cn(
            "grid gap-4 transition-all duration-700",
            layout === 'mobile' ? "grid-cols-4" : (mode === 'scientific' ? "grid-cols-7" : "grid-cols-4")
          )}>
            <AnimatePresence mode="popLayout">
              {mode === 'scientific' && (
                <motion.div 
                  key="sci-grid"
                  initial={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className={cn(
                    "grid gap-4",
                    layout === 'mobile' ? "col-span-4 grid-cols-4 mb-4 border-b pb-6" : "col-span-3 grid-cols-3",
                    isDark ? "border-zinc-800/50" : "border-zinc-100"
                  )}
                >
                  {scientificButtons.map((btn, i) => (
                    <CalculatorButton 
                      key={`sci-${i}`} 
                      label={btn.label}
                      onClick={btn.onClick}
                      variant={btn.variant}
                      className={btn.className}
                      theme={theme}
                      layout={layout}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div 
              layout
              className={cn(
                "grid gap-4",
                layout === 'mobile' ? "col-span-4 grid-cols-4" : (mode === 'scientific' ? "col-span-4 grid-cols-4" : "col-span-4 grid-cols-4")
              )}
            >
              {basicButtons.map((btn, i) => (
                <CalculatorButton 
                  key={`basic-${i}`} 
                  label={btn.label}
                  onClick={btn.onClick}
                  variant={btn.variant}
                  className={btn.className}
                  theme={theme}
                  layout={layout}
                />
              ))}
            </motion.div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono",
            isDark ? "text-zinc-600" : "text-zinc-400"
          )}>
            <Info size={10} />
            Precision Engine v2.4.0
          </div>
          <div className={cn(
            "text-lg font-black tracking-[0.4em] uppercase opacity-10",
            isDark ? "text-zinc-100" : "text-zinc-900"
          )}>
            AlgCalc
          </div>
        </div>

        {/* Decorative elements */}
        <div className={cn(
          "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000",
          isDark ? "bg-orange-500/5 opacity-100" : "bg-orange-500/10 opacity-50"
        )} />
        <div className={cn(
          "absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000",
          isDark ? "bg-zinc-500/5 opacity-100" : "bg-zinc-500/10 opacity-50"
        )} />
      </div>
      <Analytics />
    </div>
  );
}
