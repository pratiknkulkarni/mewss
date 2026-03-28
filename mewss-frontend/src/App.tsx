import './App.css'
// import {Button} from "./components/ui/button.tsx";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "./components/ui/sidebar.tsx";
import {AppSidebar} from "./components/navbar/app-sidebar.tsx";
import {Separator} from "@base-ui/react";

function App() {

    return (
        <>
            <SidebarProvider>
                <AppSidebar/>
                <SidebarInset>
                    <header
                        className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1"/>
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />

                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            <div className="aspect-video rounded-xl bg-muted/50"/>
                            <div className="aspect-video rounded-xl bg-muted/50"/>
                            <div className="aspect-video rounded-xl bg-muted/50"/>
                        </div>
                        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min"/>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/*<div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">*/
            }
            {/*    <h1 className="text-3xl font-bold">Theme working</h1>*/
            }

            {/*    <div className="flex gap-2">*/
            }
            {/*        <Button>Default</Button>*/
            }
            {/*        <Button variant="secondary">Secondary</Button>*/
            }
            {/*        <Button variant="destructive">Danger</Button>*/
            }
            {/*    </div>*/
            }
            {/*</div>*/
            }
        </>
    )
}

export default App
