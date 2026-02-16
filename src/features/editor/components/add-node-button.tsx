import { Plus, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo, useState } from "react";
import { NodeSelector } from "@/components/node-selector";

/**
 * A floating button that opens the NodeSelector sheet to add new nodes to the workflow.
 * 
 * This component is wrapped in `memo` to prevent unnecessary re-renders when the parent
 * (Editor) re-renders due to node dragging, zooming, or panning. Since this button has
 * no props, memo ensures it only re-renders when its own state (selectorOpen) changes.
 * 
 * @example
 * ```tsx
 * <Panel position="bottom-center">
 *   <AddNodeButton />
 * </Panel>
 * ```
 */
export const AddNodeButton = memo(() => {
    /**
     * Controls the visibility of the NodeSelector sheet.
     * - `true`: Sheet is open, showing available node types
     * - `false`: Sheet is closed
     */
    const [selectorOpen, setSelectorOpen] = useState(false);

    return (
        /**
         * NodeSelector is a controlled Sheet component.
         * - `open`: Current visibility state
         * - `onOpenChange`: Callback to update state (called when sheet closes via overlay click, 
         *   escape key, or after selecting a node)
         * - `children`: The trigger element (Button) that opens the sheet
         */
        <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
            {/**
             * The trigger button that opens the NodeSelector sheet.
             * - Uses `variant="outline"` for a subtle appearance
             * - `size="icon"` makes it a square button sized for just an icon
             * - `bg-background` ensures it has a solid background on the canvas
             */}
            <Button variant="outline" onClick={() => setSelectorOpen(true)} size="icon" className="bg-background">
                <PlusIcon />
            </Button>
        </NodeSelector>
    );
});

/**
 * Sets the display name for React DevTools and error stack traces.
 * Without this, the component would appear as "<Memo>" in DevTools
 * since memo() wraps an anonymous arrow function.
 */
AddNodeButton.displayName = "AddNodeButton";