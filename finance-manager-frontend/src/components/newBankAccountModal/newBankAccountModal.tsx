import { Button, Modal } from "antd";
import { useState } from "react";


export default function NewBankAccountModal({showModal, onClose}: {showModal: boolean, onClose: () => void}) {
    const [isModalOpen, setIsModalOpen] = useState(showModal);
    // if(showModal){
    //     setIsModalOpen(true);
    // }
    // const showModal = () => {
    //     setIsModalOpen(true);
    // };
    
    const handleOk = () => {
        setIsModalOpen(false);
    };
    
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="grid-container-8 modal-container p-6">
                    <button className="close-button" onClick={onClose}>
                        <span>✕</span>
                    </button>
                    <h3 className="text-center">New Category</h3>
                    <form  className="form-container flex-column">

                        <label htmlFor="description" className="py-1">Category</label>
                        <label htmlFor="color" className="py-1">Color</label>
                        <div>
                        </div>


                    </form>
                </div>
            </div>
        </>
    )
}